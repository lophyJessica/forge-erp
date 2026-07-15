import React from 'react';

export default function PageSurface({ children }: { children: React.ReactNode }) {
  return <div className="forge-page mx-auto w-full max-w-[1600px]">{children}</div>;
}
