import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Inayat Ali — Top Rated React Native & AI Mobile App Developer | GetHired Creator',
  description: 'Meet Inayat Ali, creator of GetHired and Top Rated React Native & AI developer ($25/hr) with 14+ production apps delivered.',
};

export default function CreatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

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
              <p className="text-[11px] text-slate-400 font-medium leading-none">Find & apply to high-signal remote roles</p>
            </div>
          </Link>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/70 transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-arrow-left text-xs text-slate-400"></i>
              <span>Back to Home</span>
            </Link>

            <a
              href="https://github.com/Inayat567/GetHired"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center space-x-2 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/70 transition"
            >
              <i className="fa-brands fa-github text-sm"></i>
              <span>GitHub</span>
            </a>

            <Link
              href="/dashboard"
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition transform"
            >
              <i className="fa-solid fa-bolt"></i>
              <span>Launch Workspace</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Profile Showcase */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 relative">

        {/* Hero Card */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 p-1 shadow-2xl">
                <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-4xl sm:text-5xl font-black text-white">
                  IA
                </div>
              </div>
              <div className="absolute -bottom-2 -right-1 bg-emerald-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-md border-2 border-slate-900 flex items-center space-x-1 shadow-lg">
                <i className="fa-solid fa-check text-[10px]"></i>
                <span>TOP RATED</span>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  Inayat Ali
                </h1>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold">
                  <span>$25.00 / hr</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <i className="fa-solid fa-circle text-[6px] text-emerald-400 mr-1.5 animate-pulse"></i>
                  <span>Available for New Projects</span>
                </span>
              </div>

              <p className="text-base sm:text-lg font-semibold text-slate-200">
                AI Mobile App Developer | iOS & Android, SaaS, MVP, React Native & Expo Specialist
              </p>

              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Founder at <a href="https://innunext.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-medium">innunext.com</a> and creator of <strong>GetHired</strong>. Over 14+ production mobile applications built and shipped to the Apple App Store and Google Play Store.
              </p>

              {/* Action Links */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <a
                  href="https://www.upwork.com/freelancers/~01f9a28f1fe989e240"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition transform"
                >
                  <i className="fa-solid fa-briefcase"></i>
                  <span>Hire on Upwork ($25/hr)</span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i>
                </a>

                <a
                  href="https://innunext.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm px-5 py-3 rounded-xl border border-slate-700 transition"
                >
                  <i className="fa-solid fa-globe text-slate-400"></i>
                  <span>Visit innunext.com</span>
                </a>

                <div className="flex items-center space-x-2">
                  <a
                    href="https://www.linkedin.com/in/inayatalii/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="LinkedIn Profile"
                  >
                    <i className="fa-brands fa-linkedin text-blue-400 text-base"></i>
                  </a>
                  <a
                    href="https://github.com/Inayat567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="GitHub Profile"
                  >
                    <i className="fa-brands fa-github text-base"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-3xl font-black text-white">14+</div>
              <div className="text-xs text-slate-400 mt-1">Production Mobile Apps</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-3xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Upwork Job Success</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-3xl font-black text-indigo-400">iOS & Android</div>
              <div className="text-xs text-slate-400 mt-1">Cross-Platform Native</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-3xl font-black text-purple-400">OpenAI & Gemini</div>
              <div className="text-xs text-slate-400 mt-1">AI Product Integration</div>
            </div>
          </div>
        </section>

        {/* Detailed Services */}
        <section className="space-y-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Expertise & Services</span>
            <h2 className="text-3xl font-black text-white">What I Can Build For You</h2>
            <p className="text-sm text-slate-300">From early prototype to high-scale production apps in the App Store.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl border border-indigo-500/20">
                <i className="fa-solid fa-robot"></i>
              </div>
              <h3 className="text-xl font-bold text-white">AI Mobile App Development</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Seamlessly integrate OpenAI (GPT-4o, Whisper, Assistants API) and Google Gemini directly into mobile products. Build intelligent agents, voice-to-text transcription, context-aware chatbots, and document/image recognition workflows.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">OpenAI API</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Google Gemini</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Streaming LLMs</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Vector Embeddings</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/20">
                <i className="fa-brands fa-react"></i>
              </div>
              <h3 className="text-xl font-bold text-white">React Native & Expo MVPs</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Take your Figma designs and turn them into blazing fast, pixel-perfect iOS and Android applications. Written in 100% TypeScript with clean architecture, offline-first storage, native device sensor integration, and Expo Router.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Expo SDK 52+</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">TypeScript</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Tailwind / NativeWind</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Zustand / Redux</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl border border-amber-500/20">
                <i className="fa-solid fa-wrench"></i>
              </div>
              <h3 className="text-xl font-bold text-white">App Takeover & Bug Fixing</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Inherited a messy codebase or stuck with a freelancer who left before release? I specialize in auditing existing codebases, resolving stubborn crashes, upgrading obsolete dependencies, optimizing re-renders, and getting apps accepted into the store.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">SDK Upgrades</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Performance Profiling</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Memory Leak Fixes</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Crashlytics</span>
              </div>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-purple-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl border border-purple-500/20">
                <i className="fa-solid fa-credit-card"></i>
              </div>
              <h3 className="text-xl font-bold text-white">Backend, Auth & In-App Purchases</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Monetize your app seamlessly. Full integration of RevenueCat for auto-renewing subscriptions, Stripe payment gateways, Supabase Auth with Row-Level Security, Firebase Cloud Messaging push notifications, and serverless edge functions.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">RevenueCat</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Stripe Payments</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Supabase RLS</span>
                <span className="text-[11px] font-medium bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">Apple & Google Pay</span>
              </div>
            </div>
          </div>
        </section>

        {/* Client Testimonial */}
        <section className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border-2 border-amber-500/30 shadow-2xl relative">
          <div className="flex items-center space-x-1.5 text-amber-400 mb-4">
            <i className="fa-solid fa-star"></i>
            <i className="fa-solid fa-star"></i>
            <i className="fa-solid fa-star"></i>
            <i className="fa-solid fa-star"></i>
            <i className="fa-solid fa-star"></i>
            <span className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-400">Verified Client Review on Upwork</span>
          </div>

          <blockquote className="text-base sm:text-lg text-slate-200 italic font-serif leading-relaxed">
            "Inayat has done an outstanding job building the iOS app using React Native. His technical expertise, problem-solving mindset, and attention to detail are evident in every part of the final product. He was communicative, proactive in suggesting improvements, and delivered a clean, maintainable codebase ahead of schedule. Truly exceptional work by Inayat!"
          </blockquote>

          <div className="mt-6 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-sm border border-slate-700">
              CL
            </div>
            <div>
              <div className="font-bold text-white text-sm">Satisfied Client</div>
              <div className="text-xs text-slate-400">iOS & React Native Production Project</div>
            </div>
          </div>
        </section>

        {/* Call To Action Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Ready to Build Your Mobile App or AI Feature?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Get in touch to discuss your roadmap, timeline, and architecture. Available for hourly contracts ($25/hr) or fixed-price MVP milestones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="https://www.upwork.com/freelancers/~01f9a28f1fe989e240"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transition transform"
            >
              <i className="fa-solid fa-briefcase"></i>
              <span>Hire Inayat on Upwork ($25/hr)</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-xs ml-1"></i>
            </a>

            <a
              href="https://innunext.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-base px-7 py-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
            >
              <i className="fa-solid fa-globe text-slate-400"></i>
              <span>Explore Portfolio</span>
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
            <span>GetHired Copilot — Created by Inayat Ali</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-white transition">
              Home
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
            <Link href="/dashboard" className="text-indigo-400 hover:underline">
              Launch Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
