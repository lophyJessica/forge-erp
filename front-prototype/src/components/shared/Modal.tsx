import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, title, description, children, footer, onClose, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const widthClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-3xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`w-full ${widthClass} overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl`} role="dialog" aria-modal="true" aria-labelledby="forge-modal-title">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="forge-modal-title" className="text-sm font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
          </div>
          <button type="button" aria-label="关闭弹窗" title="关闭" onClick={onClose} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </header>
        <div className="px-5 py-4 text-xs text-slate-700">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">{footer}</footer>}
      </section>
    </div>
  );
}
