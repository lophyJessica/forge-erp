import React from 'react';

export default function StatePanel({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`forge-state-panel ${error ? 'forge-state-panel--error' : ''}`}>{children}</div>;
}
