'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginModal from '@/components/LoginModal';

export default function HomePage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleStart = () => {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg border border-indigo-500/30 group-hover:scale-105 transition transform flex items-center justify-center bg-indigo-950/60">
              <img src="/logo.svg" alt="GetHired Logo" className="w-11 h-11 object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  GetHired
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Autonomous Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none">AI Job Discovery & Direct Outreach</p>
            </div>
          </Link>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <a
              href="https://github.com/Inayat567/GetHired"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/70 transition"
            >
              <i className="fa-brands fa-github text-sm"></i>
              <span>Star on GitHub</span>
            </a>

            <Link
              href="/creator"
              className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
            >
              <i className="fa-solid fa-user-astronaut text-xs"></i>
              <span>Meet Creator</span>
            </Link>

            <button
              onClick={handleStart}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition transform cursor-pointer"
            >
              <i className="fa-solid fa-bolt"></i>
              <span>{user ? 'Open Dashboard' : 'Get Started Free'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-24 sm:space-y-32 relative">

        {/* 1. Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-7">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Open Source Remote AI Job Hunter</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Stop scrolling broken job boards. <br />
            Let your <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">AI Copilot</span> hunt & pitch.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            GetHired autonomously scrapes direct company ATS endpoints (Greenhouse, Lever), RSS channels, and LinkedIn hiring posts. It deterministically rejects location-restricted and stale roles, scores deep semantic stack fit with LLMs, and crafts personalized cold outreach directly to decision-makers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-sparkles"></i>
              <span>{user ? 'Open Your Dashboard' : 'Start Job Hunting — Free'}</span>
              <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
            </button>

            <a
              href="https://github.com/Inayat567/GetHired"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-base px-7 py-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
            >
              <i className="fa-brands fa-github text-lg"></i>
              <span>View Source on GitHub</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-800 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Open-Source & BYOK</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-emerald-400">0 Bans</div>
              <div className="text-xs text-slate-400 mt-0.5">Zero account restrictions</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-indigo-400">4+ Models</div>
              <div className="text-xs text-slate-400 mt-0.5">GPT-4o, Claude, Gemini, Grok</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-2xl font-black text-purple-400">1-Click</div>
              <div className="text-xs text-slate-400 mt-0.5">Tailored cold email dispatch</div>
            </div>
          </div>
        </section>

        {/* 2. The Problem We Solve (High Contrast Dark Slate) */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">The Problem We Solve</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Why the modern job search is completely broken
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Applying for software roles in 2026 feels like shouting into an algorithmic void. Here is what engineers are up against:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-rose-500/40 transition space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl border border-rose-500/20">
                <i className="fa-solid fa-ghost"></i>
              </div>
              <h3 className="text-lg font-bold text-white">Ghost Postings & Reseller Scraping</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Over 60% of postings on major aggregators are expired, duplicated by staffing agencies harvesting resumes, or "ghost jobs" that no human recruiter ever intends to fill.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-amber-500/40 transition space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl border border-amber-500/20">
                <i className="fa-solid fa-earth-americas"></i>
              </div>
              <h3 className="text-lg font-bold text-white">"Remote" Location Bait-and-Switch</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Postings proudly tagged "Remote" only reveal in fine print: <em>"Must reside in the US"</em>, <em>"US Citizen / Green Card only"</em>, or <em>"W2 only"</em>, wasting hours of global developers' time.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-indigo-500/40 transition space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl border border-indigo-500/20">
                <i className="fa-solid fa-inbox"></i>
              </div>
              <h3 className="text-lg font-bold text-white">Recruiter Inboxes Hidden in Plain Sight</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Founders and engineering leaders frequently post direct calls on LinkedIn (<em>"Hiring an engineer! Email me your GitHub at..."</em>), but manual browsing is exhausting and risks account bans.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-purple-500/40 transition space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl border border-purple-500/20">
                <i className="fa-solid fa-robot"></i>
              </div>
              <h3 className="text-lg font-bold text-white">AI Mass-Spam Getting Auto-Filtered</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Generic 1,000-word ChatGPT cover letters get detected and discarded instantly. Hiring teams want concise proof that you understand their exact technical challenges and tech stack.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-emerald-500/40 transition space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/20">
                <i className="fa-solid fa-coins"></i>
              </div>
              <h3 className="text-lg font-bold text-white">Predatory SaaS Subscriptions</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Closed-source "auto-apply" tools charge $40–$100 every month, harvest your personal data, spam hundreds of companies with generic templates, and get your email domain blacklisted.
              </p>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-cyan-500/40 transition space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl border border-cyan-500/20">
                <i className="fa-solid fa-filter-circle-xmark"></i>
              </div>
              <h3 className="text-lg font-bold text-white">Zero Custom Stack Matching</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Traditional portals only match superficial keywords. They can't tell if an opening actually requires your deep niche (e.g. Expo SDK 52, Supabase RLS, or WebSockets) or just mentions it in passing.
              </p>
            </div>
          </div>
        </section>

        {/* 3. The 3-Stage Autonomous Pipeline */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 space-y-10">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Agentic Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">How GetHired Solves It: The 3-Stage Pipeline</h2>
            <p className="text-sm sm:text-base text-slate-300">
              Engineered with zero platform bans, strict deterministic pre-filters, and LLM semantic evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5 relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">1</div>
              <h4 className="font-bold text-white text-lg">Direct ATS Ingestion</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Scrapes verified company endpoints directly on Greenhouse, Lever, RemoteOK, and Jobicy, alongside stealth LinkedIn post monitors using headless Chromium.
              </p>
              <div className="pt-2 text-[11px] text-indigo-300 font-mono">
                ✓ No middleman aggregator delay<br />
                ✓ Fresh vacancies checked every hour
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5 relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">2</div>
              <h4 className="font-bold text-white text-lg">Deterministic Pre-Filter</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Instant regex evaluation rejects non-remote, US-citizen-restricted, low compensation, and mismatching timezone roles locally with <strong>zero LLM token cost</strong>.
              </p>
              <div className="pt-2 text-[11px] text-emerald-300 font-mono">
                ✓ Rejects "US Only" in seconds<br />
                ✓ Eliminates 85% of noise for free
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5 relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">3</div>
              <h4 className="font-bold text-white text-lg">Semantic Scoring & Outreach</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Your chosen LLM evaluates deep skill fit against your CV, assigns a 0–100% score, and crafts a concise, personalized cold email pitch citing your real portfolio projects.
              </p>
              <div className="pt-2 text-[11px] text-purple-300 font-mono">
                ✓ Personalized to hiring manager<br />
                ✓ 1-Click dispatch via Resend API
              </div>
            </div>
          </div>
        </section>

        {/* 4. Comparison Table: Traditional vs GetHired */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Head to Head</span>
            <h2 className="text-3xl font-black text-white">Traditional Job Search vs GetHired</h2>
            <p className="text-sm text-slate-300">See the difference an autonomous copilot makes in your daily search.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Feature</th>
                  <th className="py-4 px-6 text-slate-400">LinkedIn / Indeed</th>
                  <th className="py-4 px-6 text-indigo-400">GetHired Copilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-4 px-6 font-semibold text-white">Ghost Job Elimination</td>
                  <td className="py-4 px-6 text-rose-400">❌ High (30–60% stale)</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✅ Direct ATS verification</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-4 px-6 font-semibold text-white">Location Bait Filtering</td>
                  <td className="py-4 px-6 text-rose-400">❌ Manual reading required</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✅ Deterministic regex blocks "US-only"</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-4 px-6 font-semibold text-white">Hidden Recruiter Inboxes</td>
                  <td className="py-4 px-6 text-rose-400">❌ Buried in feeds</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✅ Scraped from hiring posts automatically</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-4 px-6 font-semibold text-white">Application Customization</td>
                  <td className="py-4 px-6 text-slate-400">Manual / Generic Easy Apply</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✅ Tailored pitch citing your exact portfolio</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition">
                  <td className="py-4 px-6 font-semibold text-white">Cost & Data Privacy</td>
                  <td className="py-4 px-6 text-slate-400">Data harvested / $40+ mo</td>
                  <td className="py-4 px-6 text-emerald-400 font-bold">✅ 100% Open-Source, Local SQLite & BYOK</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. How to Get Started in 3 Steps */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Fast Setup</span>
            <h2 className="text-3xl font-black text-white">Start Hunting in 3 Minutes</h2>
            <p className="text-sm text-slate-300">Zero complicated setup. Works right out of the box.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-white text-base">Set Your Profile & Stack</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add your resume, target tech stack (e.g. React Native, TypeScript, Python), timezone preferences, and salary floor in the dashboard or config file.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-white text-base">Connect Your AI Key (BYOK)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plug in your own OpenAI, Anthropic, Gemini, or Grok API key. Your credentials stay strictly on your local machine and are never shared.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-white text-base">Autonomously Scrape & Pitch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hit "Run Discovery" or let the daemon monitor jobs in the background. Review match scores, inspect tailored pitches, and dispatch in 1 click.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Meet the Creator Callout Card (Bottom of Page) */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-lg flex-shrink-0 overflow-hidden">
                <img
                  src="/Inayat.png"
                  alt="Inayat Ali"
                  className="w-full h-full rounded-[14px] object-cover bg-slate-950"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Crafted by Inayat Ali</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">Top Rated React Native Dev</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Need a Production AI or Mobile App Built?
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  14+ mobile apps delivered on iOS & Android. Specialized in React Native, Expo, AI agents, Supabase, and in-app subscriptions ($25/hr).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto flex-shrink-0">
              <Link
                href="/creator"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition transform"
              >
                <i className="fa-solid fa-user-astronaut"></i>
                <span>Meet the Creator</span>
                <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
            <span>GetHired Copilot — Autonomous Job Discovery & Outreach</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/creator"
              className="hover:text-emerald-400 transition flex items-center space-x-1 font-medium"
            >
              <span>✦ Meet the Creator</span>
            </Link>
            <span>•</span>
            <a
              href="https://github.com/Inayat567/GetHired"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              GitHub Repo
            </a>
            <span>•</span>
            <button
              onClick={handleStart}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              {user ? 'Open Dashboard' : 'Start Job Hunting'}
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Login Modal on Home Page */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
}
