'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace('/?session_expired=true');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace('/?auth_required=true');
      });
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden flex flex-col">
      <iframe
        src="/workspace.html"
        className="w-full h-full border-0 flex-1"
        title="GetHired Workspace"
      />
    </div>
  );
}
