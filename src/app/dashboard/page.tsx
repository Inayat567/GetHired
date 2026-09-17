'use client';

import React from 'react';

export default function DashboardPage() {
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
