import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, PackageOpen, Send } from 'lucide-react';
import { integrationApi } from '../api/integration';
import { PURCHASE_ORDER_SYNC_STATUS_LABELS, PurchaseOrderSyncStatus } from '../types/integration';

const STATUS_META: Record<PurchaseOrderSyncStatus, { icon: React.ReactNode; classes: string }> = {
  PENDING_DISPATCH: { icon: <Clock3 size={11} />, classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  DISPATCHED: { icon: <Send size={11} />, classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PARTIAL_RECEIVED: { icon: <PackageOpen size={11} />, classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  FULL_RECEIVED: { icon: <CheckCircle2 size={11} />, classes: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export default function WmsStatusTag({ poId }: { poId: string }) {
  const [status, setStatus] = useState<PurchaseOrderSyncStatus>('PENDING_DISPATCH');

  useEffect(() => {
    let mounted = true;
    integrationApi.getPurchaseOrderWmsStatus(poId).then(nextStatus => {
      if (mounted) setStatus(nextStatus);
    });
    return () => {
      mounted = false;
    };
  }, [poId]);

  const meta = STATUS_META[status] ?? { icon: <Clock3 size={11} />, classes: 'bg-slate-100 text-slate-500 border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${meta.classes}`}>
      <span className="shrink-0">{meta.icon}</span>
      <span>{PURCHASE_ORDER_SYNC_STATUS_LABELS[status]}</span>
    </span>
  );
}
