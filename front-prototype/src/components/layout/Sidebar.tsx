import React from 'react';

export default function Sidebar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <aside className={`flex shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 ${className}`}>{children}</aside>;
}
