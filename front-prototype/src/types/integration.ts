export type PurchaseOrderSyncStatus = 'PENDING_DISPATCH' | 'DISPATCHED' | 'PARTIAL_RECEIVED' | 'FULL_RECEIVED';

export interface PurchaseOrderSyncItem {
  id: string;
  productCode: string;
  productName: string;
  productBarcode?: string;
  productSpec: string;
  unit: string;
  quantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
}

export interface PurchaseOrderSync {
  poId: string;
  supplier: {
    code: string;
    name: string;
  };
  warehouse: {
    code: string;
    name: string;
  };
  items: PurchaseOrderSyncItem[];
  status: PurchaseOrderSyncStatus;
  syncTime: string;
  sourceSystem?: 'ERP' | 'WMS';
  targetSystem?: 'ERP' | 'WMS';
  lastReceiptId?: string;
  appliedReceiptIds?: string[];
}

export const PURCHASE_ORDER_SYNC_STATUS_LABELS: Record<PurchaseOrderSyncStatus, string> = {
  PENDING_DISPATCH: '待下发',
  DISPATCHED: '已下发',
  PARTIAL_RECEIVED: '部分收货',
  FULL_RECEIVED: '全部收货',
};
