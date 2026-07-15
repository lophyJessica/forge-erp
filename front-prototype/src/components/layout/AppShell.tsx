import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  topNav: React.ReactNode;
  children: React.ReactNode;
}

/** Shared ERP shell: fixed-height application frame with independent content scrolling. */
export default function AppShell({ sidebar, topNav, children }: AppShellProps) {
  return (
    <div className="app-shell flex h-screen min-h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {sidebar}
      <div className="app-main-panel flex min-w-0 flex-1 flex-col">
        {topNav}
        <main className="app-content forge-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
