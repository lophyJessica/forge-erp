import React, { useEffect, useState } from 'react';
import { integrationApi } from '../api/integration';
import { PURCHASE_ORDER_SYNC_STATUS_LABELS, PurchaseOrderSyncStatus } from '../types/integration';

const STATUS_META: Record<PurchaseOrderSyncStatus, { icon: string; classes: string }> = {
  PENDING_DISPATCH: { icon: '🟡', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  DISPATCHED: { icon: '🟢', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PARTIAL_RECEIVED: { icon: '🔵', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  FULL_RECEIVED: { icon: '✅', classes: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
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

  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${meta.classes}`}>
      <span>{meta.icon}</span>
      <span>{PURCHASE_ORDER_SYNC_STATUS_LABELS[status]}</span>
    </span>
  );
}
