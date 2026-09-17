import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Floating Glow Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-850">
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
              <p className="text-[11px] text-slate-400 font-medium leading-none">Find & apply to high-signal remote roles</p>
            </div>
          </Link>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <a
              href="https://github.com/Inayat567/GetHired"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition"
            >
              <i className="fa-brands fa-github text-sm"></i>
              <span>Star on GitHub</span>
            </a>

            <a
              href="https://innunext.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition"
            >
              <span>☕</span>
              <span>Buy me a coffee</span>
            </a>

            <Link
              href="/dashboard"
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition transform"
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Sign In & Launch</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-28 relative">

        {/* 1. Hero Section */}
        <section className="text-center max-w-4xl mx-auto space-y-7">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Open Source Remote Job Search Agent</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Stop scrolling job boards. <br />
            Let your <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">AI Copilot</span> hunt and apply.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            GetHired autonomously scrapes direct company ATS endpoints (Greenhouse, Lever), LinkedIn posts, and remote boards, filters out US-only/visa-restricted roles, matches your exact tech stack, and drafts tailored recruiter pitches.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition transform active:scale-95"
            >
              <i className="fa-solid fa-bolt"></i>
              <span>Open GetHired Dashboard</span>
              <i className="fa-solid fa-arrow-right text-xs ml-1"></i>
            </Link>

            <a
              href="https://github.com/Inayat567/GetHired"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900/90 hover:bg-slate-850 text-slate-200 font-bold text-base px-7 py-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
            >
              <i className="fa-brands fa-github text-lg"></i>
              <span>View Source Code</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-850/80 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-white">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Open-Source & BYOK</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-emerald-400">0 Bans</div>
              <div className="text-xs text-slate-400 mt-0.5">Zero LinkedIn restrictions</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-indigo-400">4+ AI Models</div>
              <div className="text-xs text-slate-400 mt-0.5">GPT-4o, Claude, Gemini, Grok</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="text-2xl font-black text-purple-400">1-Click</div>
              <div className="text-xs text-slate-400 mt-0.5">Cold pitch email dispatch</div>
            </div>
          </div>
        </section>

        {/* 2. The Problem & How GetHired Solves It */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">The Problem We Solve</h2>
            <p className="text-3xl font-extrabold text-white mt-1.5">Why the modern job search is completely broken</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl border border-rose-500/20">
                <i className="fa-solid fa-ghost"></i>
              </div>
              <h3 className="text-lg font-bold text-white">Ghost & Aggregator Clones</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Most job boards are flooded with expired postings, third-party spam recruiters, and ghost jobs posted months ago that nobody monitors.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl border border-amber-500/20">
                <i className="fa-solid fa-earth-americas"></i>
              </div>
              <h3 className="text-lg font-bold text-white">"Remote" Location Bait</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Jobs labeled "Remote" only reveal in fine print: <em>"US Citizen or Green Card only"</em> or <em>"W2 only"</em>, wasting hours of global engineers' time.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl border border-indigo-500/20">
                <i className="fa-solid fa-inbox"></i>
              </div>
              <h3 className="text-lg font-bold text-white">Recruiter Inboxes Hidden</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Founders and hiring managers post informal hiring notices on LinkedIn (<em>"Email me your CV at..."</em>), but manual browsing is tedious and gets accounts flagged.
              </p>
            </div>
          </div>
        </section>

        {/* 3. The 3-Stage Autonomous Engine */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 space-y-10">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Agentic Architecture</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">How the 3-Stage Pipeline Works</h2>
            <p className="text-sm text-slate-300 mt-2">
              Engineered with zero platform bans, strict deterministic pre-filters, and LLM semantic evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">1</div>
              <h4 className="font-bold text-white text-base">Multi-Source Ingestion</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scrapes Greenhouse, Lever, RemoteOK, Jobicy, WeWorkRemotely, and LinkedIn posts using headless Chromium and direct RSS feeds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">2</div>
              <h4 className="font-bold text-white text-base">Deterministic Pre-Filter</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant regex evaluation rejects non-remote, US-citizen-restricted, low compensation, and mismatching country/timezone roles with zero LLM cost.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">3</div>
              <h4 className="font-bold text-white text-base">Semantic AI Scoring & Pitch</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates deep skill fit using OpenAI, Claude, Gemini, or Grok, calculates a 0–100% score, and generates a personalized cold email pitch citing your CV achievements.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Creator & Developer Consulting Showcase */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <i className="fa-solid fa-star text-amber-400 text-[11px]"></i>
                <span>Meet the Creator & Specialist</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Need a Custom AI App or Senior React Native Developer?
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Hi, I'm <strong>Inayat Ali</strong> — a <strong>Top Rated React Native & AI Mobile App Developer</strong> ($25/hr). I have delivered <strong>14+ production mobile apps</strong> on iOS & Android, from initial MVP and Figma design to App Store launches, RevenueCat subscriptions, Supabase backends, and OpenAI/Gemini integrations.
              </p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">React Native & Expo</span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">AI Assistants (OpenAI / Gemini)</span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">RevenueCat & Stripe In-App Payments</span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">Supabase & Firebase</span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">App Store & Google Play Launch</span>
              </div>

              {/* Client Review Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 italic font-serif leading-relaxed mt-3">
                <i className="fa-solid fa-quote-left text-amber-400 mr-2 opacity-80"></i>
                "Inayat has done an outstanding job building the iOS app using React Native. His technical expertise, problem-solving mindset, and attention to detail are evident in every part of the final product... Truly exceptional work by Inayat!"
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col w-full sm:w-auto space-y-3 flex-shrink-0">
              <a
                href="https://www.upwork.com/freelancers/~01f9a28f1fe989e240"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition transform text-sm text-center"
              >
                <i className="fa-solid fa-briefcase"></i>
                <span>Hire on Upwork ($25/hr)</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i>
              </a>

              <a
                href="https://innunext.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-750 text-white font-semibold px-6 py-3 rounded-xl border border-slate-700 transition text-sm text-center"
              >
                <i className="fa-solid fa-globe"></i>
                <span>Visit Portfolio (innunext.com)</span>
              </a>

              <div className="flex items-center justify-center space-x-2 pt-1">
                <a
                  href="https://www.linkedin.com/in/inayatalii/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center space-x-1.5"
                >
                  <i className="fa-brands fa-linkedin text-blue-400"></i>
                  <span>LinkedIn</span>
                </a>
                <span className="text-slate-700">•</span>
                <a
                  href="https://github.com/Inayat567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center space-x-1.5"
                >
                  <i className="fa-brands fa-github"></i>
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
            <span>GetHired Copilot — Open Source Software Engineer Career Agent</span>
          </div>

          <div className="flex items-center space-x-4">
            <a href="https://innunext.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition flex items-center space-x-1">
              <span>☕ Buy me a coffee</span>
            </a>
            <span>•</span>
            <a href="https://github.com/Inayat567/GetHired" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              GitHub Repo
            </a>
            <span>•</span>
            <Link href="/dashboard" className="text-indigo-400 hover:underline">
              Launch Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
