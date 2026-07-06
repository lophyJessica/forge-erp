import type { TaxRate } from './purchaseOrder';

export type RfqStatus = 'DRAFT' | 'QUOTING' | 'AWARDED' | 'VOIDED';

export interface RfqItem {
  id: string;
  productCode: string;
  productName: string;
  productSpec: string;
  unit: string;
  quantity: number;
}

export interface RfqQuoteLine {
  itemId: string;
  unitPrice: number;
  deliveryDays: number;
  taxRate: TaxRate | '';
}

export interface RfqSupplierQuote {
  supplierCode: string;
  supplierName: string;
  status: 'PENDING' | 'SUBMITTED';
  submittedAt?: string;
  lines: RfqQuoteLine[];
}

export interface RfqAwardLine {
  itemId: string;
  supplierCode: string;
}

export interface RfqOrder {
  id: string;
  title: string;
  deadline: string;
  status: RfqStatus;
  itemCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  voidReason?: string;
  items: RfqItem[];
  quotes: RfqSupplierQuote[];
  awards?: RfqAwardLine[];
  convertedPoIds?: string[];
}

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  DRAFT: '草稿',
  QUOTING: '询价中',
  AWARDED: '已定标',
  VOIDED: '已作废',
};
