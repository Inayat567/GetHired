'use client';

import React, { useEffect } from 'react';

interface CreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatorModal({ isOpen, onClose }: CreatorModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 text-slate-100">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-r from-emerald-500/20 via-indigo-500/20 to-purple-500/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition z-20"
        >
          <i className="fa-solid fa-xmark text-base"></i>
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 p-1 shadow-xl">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-3xl font-black text-white">
                  IA
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-md border border-slate-900 flex items-center space-x-1 shadow">
                <i className="fa-solid fa-check text-[9px]"></i>
                <span>TOP RATED</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Inayat Ali
                </h3>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span>$25.00 / hr</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <i className="fa-solid fa-circle text-[6px] text-emerald-400 mr-1 animate-pulse"></i>
                  <span>Available for Hire</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-300">
                AI Mobile App Developer | iOS & Android, SaaS, MVP, React Native & Expo Specialist
              </p>
              <p className="text-xs text-slate-400">
                Founder at <a href="https://innunext.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">innunext.com</a> • Creator of GetHired
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xl font-black text-white">14+</div>
              <div className="text-[11px] text-slate-400">Apps in Production</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xl font-black text-emerald-400">100%</div>
              <div className="text-[11px] text-slate-400">Top Rated on Upwork</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xl font-black text-indigo-400">iOS & Android</div>
              <div className="text-[11px] text-slate-400">Cross-Platform Native</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xl font-black text-purple-400">OpenAI & Gemini</div>
              <div className="text-[11px] text-slate-400">AI Product Integration</div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[50vh] overflow-y-auto">
          {/* About & Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">About Inayat</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              I build production-ready AI and mobile apps for iOS and Android using React Native, Expo, and TypeScript. I work with startups and businesses worldwide from initial MVP development and Figma design translation to existing app takeovers, AI integrations, subscription architectures, and App Store / Google Play launches.
            </p>
          </div>

          {/* What I can help you with */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">What I Can Help You With</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                  <i className="fa-solid fa-robot"></i>
                  <span>AI Mobile App Development</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI assistants, intelligent workflows, and AI features integrated into mobile apps using OpenAI, Gemini, and custom LLM APIs.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <i className="fa-brands fa-react"></i>
                  <span>React Native & Expo MVPs</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Full-cycle iOS and Android builds from Figma designs into polished, fast, clean codebases ready for app store approval.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <i className="fa-solid fa-wrench"></i>
                  <span>App Takeovers & Bug Fixing</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Taking over legacy code, diagnosing memory leaks, upgrading Expo SDKs, and fixing complex cross-platform crashes.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                  <i className="fa-solid fa-database"></i>
                  <span>Backend, Auth & Subscriptions</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Supabase, Firebase, RevenueCat in-app subscriptions, Stripe payments, and rock-solid offline-first sync.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack Chips */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Core Competencies</h4>
            <div className="flex flex-wrap gap-2">
              {[
                'React Native',
                'Expo (SDK 50+)',
                'TypeScript',
                'OpenAI API',
                'Google Gemini',
                'RevenueCat',
                'Stripe Payments',
                'Supabase',
                'Firebase',
                'Redux / Zustand',
                'Tailwind / NativeWind',
                'App Store & Play Store Submissions',
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 text-xs font-medium border border-slate-700/60"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Client Testimonial */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-xs text-slate-300 italic font-serif leading-relaxed relative">
            <div className="text-amber-400 font-sans font-bold text-[11px] not-italic mb-1 flex items-center space-x-1.5">
              <i className="fa-solid fa-star text-amber-400"></i>
              <i className="fa-solid fa-star text-amber-400"></i>
              <i className="fa-solid fa-star text-amber-400"></i>
              <i className="fa-solid fa-star text-amber-400"></i>
              <i className="fa-solid fa-star text-amber-400"></i>
              <span className="ml-1 text-slate-400 font-normal">Verified Upwork Client Review</span>
            </div>
            <p>
              "Inayat has done an outstanding job building the iOS app using React Native. His technical expertise, problem-solving mindset, and attention to detail are evident in every part of the final product... Truly exceptional work by Inayat!"
            </p>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-start">
            <a
              href="https://innunext.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-globe text-slate-400"></i>
              <span>innunext.com</span>
            </a>
            <a
              href="https://www.linkedin.com/in/inayatalii/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition flex items-center space-x-1.5"
            >
              <i className="fa-brands fa-linkedin text-blue-400"></i>
              <span>LinkedIn</span>
            </a>
            <a
              href="https://github.com/Inayat567"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-300 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition flex items-center space-x-1.5"
            >
              <i className="fa-brands fa-github text-slate-400"></i>
              <span>GitHub</span>
            </a>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Close
            </button>
            <a
              href="https://www.upwork.com/freelancers/~01f9a28f1fe989e240"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition transform"
            >
              <i className="fa-solid fa-briefcase"></i>
              <span>Hire Inayat on Upwork ($25/hr)</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px] ml-1"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
