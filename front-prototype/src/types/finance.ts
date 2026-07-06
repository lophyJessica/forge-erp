export type SettlementStatus = 'UNSETTLED' | 'PARTIAL' | 'SETTLED';

export interface ReceivableSource {
  id: string;
  sourceNo: string;
  customerCode: string;
  customerName: string;
  amount: number;
  sourceDate: string;
  remark?: string;
}

export interface PayableSource {
  id: string;
  sourceNo: string;
  supplierCode: string;
  supplierName: string;
  amount: number;
  sourceDate: string;
  remark?: string;
}

export interface ReceiptRecord {
  id: string;
  customerCode: string;
  customerName: string;
  sourceNo: string;
  amount: number;
  receiptDate: string;
  operator: string;
  remark?: string;
}

export interface PaymentRecord {
  id: string;
  supplierCode: string;
  supplierName: string;
  sourceNo: string;
  amount: number;
  paymentDate: string;
  operator: string;
  remark?: string;
}

export interface ReceivableSummary {
  customerCode: string;
  customerName: string;
  receivableAmount: number;
  receivedAmount: number;
  balance: number;
  lastTransactionDate: string;
  status: SettlementStatus;
}

export interface PayableSummary {
  supplierCode: string;
  supplierName: string;
  payableAmount: number;
  paidAmount: number;
  balance: number;
  lastTransactionDate: string;
  status: SettlementStatus;
}

export interface SourceBalance {
  sourceNo: string;
  partnerCode: string;
  partnerName: string;
  amount: number;
  settledAmount: number;
  balance: number;
  sourceDate: string;
  status: SettlementStatus;
}

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  UNSETTLED: '未核销',
  PARTIAL: '部分核销',
  SETTLED: '已核销',
};
