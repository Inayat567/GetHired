import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Database } from 'sqlite';
import { AppConfig } from '../config';
import { LLMEvaluationResult, Job, UserSettings, AIProvider } from '../types';
import { updateJobEvaluation } from '../db/database';

interface ResolvedAISettings {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

function resolveAISettings(config: AppConfig, userSettings?: UserSettings): ResolvedAISettings {
  if (userSettings) {
    return {
      provider: userSettings.ai_provider || 'openai',
      model: userSettings.ai_model || 'gpt-4o-mini',
      apiKey: userSettings.api_key || '',
    };
  }

  // Fallback to environment variables only if no userSettings object was passed (e.g. headless CLI)
  const envProvider = ((process.env.LLM_PROVIDER as any) || 'openai') as AIProvider;
  const envKey =
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GROK_API_KEY ||
    config.llm.apiKey ||
    '';

  return {
    provider: envProvider,
    model: process.env.LLM_MODEL || config.llm.model || 'gpt-4o-mini',
    apiKey: envKey,
  };
}

function cleanJsonString(raw: string): string {
  // Remove markdown code fences if model enclosed JSON in ```json ... ```
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  settings: ResolvedAISettings
): Promise<string> {
  const { provider, model, apiKey } = settings;

  // 1. ANTHROPIC CLAUDE
  if (provider === 'claude') {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.2,
      system: systemPrompt + ' Output strictly raw valid JSON. Do not include markdown codeblocks or commentary.',
      messages: [{ role: 'user', content: userPrompt }],
    });

    const block = response.content[0];
    if (block && 'text' in block) {
      return block.text;
    }
    throw new Error('No text block returned from Claude');
  }

  // 2. GOOGLE GEMINI
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({
      model: model || 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = await modelInstance.generateContent([
      { text: `${systemPrompt}\n\n${userPrompt}` },
    ]);
    return result.response.text();
  }

  // 3. xAI GROK
  if (provider === 'grok') {
    const grokClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
    });

    const response = await grokClient.chat.completions.create({
      model: model || 'grok-2-latest',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });
    return response.choices[0]?.message?.content || '{}';
  }

  // 4. OPENAI (Default)
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: model || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
  });
  return response.choices[0]?.message?.content || '{}';
}

export async function evaluateJobWithLLM(
  job: { company: string; title: string; location_raw?: string | null; description_text: string },
  config: AppConfig,
  userSettings?: UserSettings
): Promise<LLMEvaluationResult> {
  const aiSettings = resolveAISettings(config, userSettings);

  const systemPrompt =
    'You are an elite developer career strategist and technical recruiter. You evaluate engineering opportunities against candidate qualifications and draft high-conversion cold outreach pitches. Always respond in valid JSON matching the requested schema.';

  const prompt = `
Candidate Profile:
${JSON.stringify(config.candidateProfile, null, 2)}

Candidate Preferences:
${JSON.stringify(config.preferences, null, 2)}

Job Opportunity to Evaluate:
Company: ${job.company}
Role: ${job.title}
Location: ${job.location_raw || 'Remote'}
Description:
${job.description_text.substring(0, 3500)}

Instructions:
Evaluate the role strictly against candidate qualifications and preferences.
1. Provide a realistic match score from 0 to 100 based on technical overlap, remote feasibility, and experience.
2. If match score < ${config.preferences.match_threshold}, set 'should_apply' to false and provide a 1-sentence disqualification reason.
3. If match score >= ${config.preferences.match_threshold}:
   - Extract any explicit recruiter or hiring contact email and name from the description if present.
   - Write a compelling, concise 3-paragraph cold email pitch (maximum 170 words) directly highlighting 2 relevant technical accomplishments from the candidate profile matching the role requirements.
   - Avoid generic fluff ("I hope this email finds you well", "I am writing to apply"). Jump directly into value and technical fit.
   - Mention the candidate's portfolio/github link and CV attachment.

Return strictly valid JSON with this exact schema:
{
  "match_score": number,
  "should_apply": boolean,
  "disqualification_reason": string or null,
  "contact_email": string or null,
  "contact_name": string or null,
  "key_matching_skills": ["string", "string"],
  "cold_email_subject": "string",
  "cold_email_body": "string"
}
`;

  try {
    const rawContent = await callAI(systemPrompt, prompt, aiSettings);
    const cleaned = cleanJsonString(rawContent);
    return JSON.parse(cleaned) as LLMEvaluationResult;
  } catch (err: any) {
    console.error(`[LLM Evaluator - ${aiSettings.provider}] Error evaluating job at ${job.company}:`, err.message);
    return {
      match_score: 50,
      should_apply: false,
      disqualification_reason: `AI (${aiSettings.provider}) evaluation error: ${err.message}`,
    };
  }
}

export async function evaluatePendingJobs(
  db: Database,
  config: AppConfig,
  limit: number = 10,
  userSettings?: UserSettings
): Promise<number> {
  const aiSettings = resolveAISettings(config, userSettings);

  if (!aiSettings.apiKey) {
    console.warn(`⚠️  No API key configured for ${aiSettings.provider}. Please configure your API key in the Web Dashboard or .env file.`);
    return 0;
  }

  const pendingJobs = await db.all<Job[]>(
    `SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );

  console.log(`🧠 Found ${pendingJobs.length} pending jobs. Evaluating with ${aiSettings.provider} (${aiSettings.model})...`);
  let evaluatedCount = 0;

  for (const job of pendingJobs) {
    console.log(`  Evaluating: ${job.title} @ ${job.company}...`);
    const evalResult = await evaluateJobWithLLM(job, config, userSettings);

    const isQualified = evalResult.should_apply && evalResult.match_score >= config.preferences.match_threshold;
    const newStatus = isQualified ? 'qualified' : 'skipped';

    await updateJobEvaluation(db, job.id, {
      match_score: evalResult.match_score,
      should_apply: evalResult.should_apply,
      disqualification_reason: evalResult.disqualification_reason,
      recruiter_email: evalResult.contact_email,
      recruiter_name: evalResult.contact_name,
      key_matching_skills: evalResult.key_matching_skills,
      tailored_pitch: evalResult.cold_email_body,
      email_subject: evalResult.cold_email_subject,
      status: newStatus,
      skipped_by: newStatus === 'skipped' ? 'auto' : undefined,
    });

    evaluatedCount++;
    console.log(`   -> Match Score: ${evalResult.match_score}% | Status: ${newStatus}`);
  }

  return evaluatedCount;
}
