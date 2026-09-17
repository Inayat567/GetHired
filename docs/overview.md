# GetHired 🚀
### Autonomous Remote Job Discovery & Application Copilot

**GetHired** is a local-first, privacy-respecting, developer-centric agentic tool designed to eliminate the repetitive grind of searching for remote tech jobs. It continuously discovers high-signal job opportunities across Applicant Tracking Systems (ATS), aggregator feeds, and LinkedIn, filters out noise deterministically according to your precise regional & compensation preferences, semantically evaluates fit with an LLM, and prepares personalized cold outreach for your approval.

---

## 💡 Why GetHired?

Job hunting today is broken in two ways:
1. **Manual searching is exhausting:** Manually browsing LinkedIn, job boards, and company career pages every day takes hours.
2. **Blind automation gets banned:** Automated bots that spam hundreds of job boards trigger Cloudflare/anti-bot bans and produce generic applications that recruiters immediately trash.

**GetHired solves this with a Human-in-the-Loop (HITL) Copilot:**
* **Zero Platform Bans:** Works with clean public ATS endpoints and persistent, rate-limited local browser sessions.
* **Bring-Your-Own-Key (BYOK):** Completely free and open-source. Runs 100% on your local machine using SQLite and your preferred AI provider (**OpenAI, Anthropic Claude, Google Gemini, or xAI Grok**).
* **Multi-AI & Model Flexibility:** Configure your AI provider and latest models (`gpt-4o-mini`, `claude-3-5-sonnet`, `gemini-2.0-flash`, `grok-2-latest`) directly from the Web Dashboard.
* **High-Precision Targeting:** Fast deterministic filters discard ineligible roles (e.g., location, visa restrictions, unaligned compensation or employment type) before passing candidates to the LLM.
* **Global & Regional Flexibility:** Built-in multi-country support (Belgium, Netherlands, Germany, Austria, Australia, Bulgaria, Canada, UK, Worldwide Remote) with multi-currency parsing (`USD $` & `EUR €`).
* **Personalized Outreach:** The LLM crafts high-conversion, concise email pitches tailored to your actual portfolio and past achievements.
* **You Maintain Control:** Every application or email requires your explicit 1-click confirmation before anything is sent.

---

## 🏗️ Architecture at a Glance

```
                         ┌────────────────────────────────────────────────────────┐
                         │                  DATA INGESTION ENGINE                 │
                         │  • ATS APIs (Greenhouse, Lever, Ashby)                 │
                         │  • Remote Feeds (RemoteOK, Jobicy, WeWorkRemotely)     │
                         │  • LinkedIn (Public search & "Hiring" feed posts)      │
                         └───────────────────────────┬────────────────────────────┘
                                                     │
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │              NORMALIZATION & DEDUPLICATION             │
                         │  • SHA-256 fingerprinting                              │
                         │  • Local SQLite database persistence                   │
                         │  • Skip previously seen / applied listings             │
                         └───────────────────────────┬────────────────────────────┘
                                                     │
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │             DETERMINISTIC RULE-BASED FILTER            │
                         │  • Stack alignment (e.g., React Native, TypeScript)    │
                         │  • Country & visa restrictions (e.g., US/W2 Only)      │
                         │  • Timezone difference limits (e.g., CET, UTC)         │
                         │  • Employment type & minimum pay ($/€ per month/hour)  │
                         └───────────────────────────┬────────────────────────────┘
                                                     │ (Qualified listings)
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │            SEMANTIC EVALUATOR & TAILOR (LLM)           │
                         │  • Semantic match scoring (0 - 100%) against CV        │
                         │  • Recruiter contact extraction (Email, Name)          │
                         │  • Custom cold email & cover letter drafting           │
                         └───────────────────────────┬────────────────────────────┘
                                                     │ (Score >= 75%)
                                                     ▼
                         ┌────────────────────────────────────────────────────────┐
                         │              HUMAN-IN-THE-LOOP CLI TRIAGE              │
                         │  • Interactive terminal review card                    │
                         │  • [✉️ Send Email]  [🌐 Open URL]  [⏭️ Skip]             │
                         └───────────────────────────┬────────────────────────────┘
                                                     │
                             ┌───────────────────────┼───────────────────────┐
                             │ "Send Email"          │ "Open URL"            │ "Skip"
                             ▼                       ▼                       ▼
                  ┌──────────────────────┐  ┌─────────────────┐   ┌──────────────────────┐
                  │ SMTP Dispatcher      │  │ Browser Opener  │   │ DB Update            │
                  │ Sends cold email +   │  │ Launches your   │   │ Marks listing as     │
                  │ attached PDF CV      │  │ default browser │   │ 'skipped' in SQLite  │
                  └──────────────────────┘  └─────────────────┘   └──────────────────────┘
```

---

## 🎯 User Preferences Model

GetHired features a customizable `preferences.json` where you configure:

1. **Employment Types:** `full-time`, `part-time`, `contract`, or any combination.
2. **Compensation Boundaries:**
   - Currency: `USD` or `EUR`
   - Minimum monthly salary (e.g. `4000` $/€ per month)
   - Minimum hourly rate (e.g. `35` $/€ per hour)
   - Strict filter vs. permissive for undisclosed salaries.
3. **Geographic Whitelist & Blacklist:**
   - Target countries: Belgium, Netherlands, Germany, Austria, Australia, Bulgaria, Canada, UK, Worldwide Remote.
   - Disallowed phrases: "US Citizen Only", "W2 Only", "Must have EU passport", etc.
4. **Timezone Flexibility:**
   - Candidate UTC offset (e.g., UTC+5)
   - Maximum tolerable timezone gap (e.g. within 6 hours of CET/UTC).

---

## 📦 Core Pipeline Components

### 1. Ingestion Channels
* **ATS Endpoints:** Queries clean JSON endpoints for Greenhouse (`boards-api.greenhouse.io`), Lever (`api.lever.co`), and Ashby (`jobs.ashbyhq.com`).
* **Remote Feeds:** RSS/JSON feeds from RemoteOK, Jobicy, and We Work Remotely for international and contract-friendly postings.
* **LinkedIn Scanner:**
  * *Public Jobs:* Queries LinkedIn's guest search without requiring login credentials.
  * *Hiring Posts:* Uses a local persistent browser context (Playwright) to discover informal "We are hiring" posts containing direct recruiter contact emails.

### 2. Database & State Store (`jobs.db`)
* Powered by local SQLite.
* Every job is fingerprinted using `SHA256(company + title + apply_url)` to guarantee you never review or apply to the same job twice.
* Tracks statuses: `pending`, `qualified`, `applied`, `skipped`, `failed`.

### 3. Deterministic Pre-Filtering
Before making expensive LLM calls, deterministic filters reject postings that:
* Lack required core tech keywords (e.g., "React Native", "Expo").
* Violate country or visa constraints.
* Fall below minimum salary/rate when explicitly stated.
* Mismatch chosen employment type (e.g., part-time only when candidate wanted full-time).

### 4. Semantic Evaluation & Tailoring Engine
Matches candidates against `candidate_profile.json`:
* Evaluates overlap, seniority, and contract flexibility.
* Automatically extracts recruiter/hiring manager email addresses.
* Generates a 3-paragraph (under 180 words) cold pitch citing your specific portfolio metrics.

### 5. Interactive CLI Triage
Instead of requiring external bot setups upfront:
* Run `npm run triage` to inspect qualified leads in your terminal.
* Read the generated pitch, review the match score, and select your action:
  * **Send Email:** Dispatches the email through your configured SMTP (e.g., Gmail App Password) with your resume PDF attached.
  * **Open URL:** Opens the application URL in your default desktop browser.
  * **Skip:** Marks the job as skipped in SQLite.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (v18+) with TypeScript
* **Database:** SQLite (`sqlite3` / `better-sqlite3`)
* **Automation:** Playwright (Chromium persistent context)
* **AI Providers:** OpenAI (GPT-4o, GPT-4o-mini), Anthropic (Claude 3.5 Sonnet, Haiku), Google (Gemini 2.0 Flash, 1.5 Pro), xAI (Grok 2)
* **Email Dispatcher:** Nodemailer (SMTP)
* **Web UI & CLI:** Responsive Local Dashboard (`http://localhost:3000`) and Interactive Terminal Triage

---

## 🚀 Quick Workflow

1. Configure your technical background in `candidate_profile.json`.
2. Configure your criteria (countries, salary, employment type) in `preferences.json`.
3. Drop your resume at `assets/cv.pdf`.
4. Set your API key and SMTP settings in `.env`.
5. Run `npm run discover` to scrape and qualify new leads.
6. Run `npm run triage` to review matching leads and send applications.
