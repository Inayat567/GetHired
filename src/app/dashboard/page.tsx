'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginModal from '@/components/LoginModal';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    // Check session
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Dashboard Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-indigo-600/20 border border-indigo-500/30">
              <img src="/logo.svg" alt="GetHired Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white">GetHired</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">Autonomous Job Discovery</p>
            </div>
          </Link>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/creator"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition hidden sm:flex items-center space-x-1"
            >
              <i className="fa-solid fa-user-astronaut text-xs"></i>
              <span>Meet Creator</span>
            </Link>

            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition hidden sm:inline-block"
            >
              ← Home
            </Link>

            {user ? (
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-2 bg-slate-800 py-1 px-2.5 rounded-lg border border-slate-700">
                  <img src={user.avatar_url || '/logo.svg'} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-xs font-semibold text-white max-w-[110px] truncate">{user.name || user.email}</span>
                </div>
                <button
                  onClick={() => {
                    fetch('/api/auth/logout', { method: 'POST' }).then(() => (window.location.href = '/dashboard'));
                  }}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <i className="fa-solid fa-power-off"></i>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Embed the interactive engine */}
      <main className="flex-1 w-full">
        <iframe
          src="/workspace.html"
          className="w-full h-full min-h-[calc(100vh-64px)] border-0"
          title="GetHired Workspace"
        />
      </main>

      {/* Creator Freelance Banner in Dashboard Footer */}
      <footer className="bg-slate-900 text-slate-300 py-4 px-4 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-400">
          <span>GetHired Copilot by <Link href="/creator" className="text-white hover:text-emerald-400 font-bold underline decoration-slate-600">Inayat Ali</Link></span>
          <span>•</span>
          <span className="text-slate-500">Autonomous Job Discovery & Outreach</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/creator" className="text-emerald-400 hover:underline">
            Meet the Creator
          </Link>
          <span>•</span>
          <a
            href="https://www.upwork.com/freelancers/~01f9a28f1fe989e240"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg transition"
          >
            Hire on Upwork ($25/hr)
          </a>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setLoginModalOpen(false);
          // Reload iframe to refresh session state inside workspace
          const iframe = document.querySelector('iframe');
          if (iframe) iframe.src = '/workspace.html';
        }}
      />
    </div>
  );
}
