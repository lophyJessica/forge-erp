export type SalesOrderStatus =
  | 'DRAFT'
  | 'PENDING_AUDIT'
  | 'APPROVED'
  | 'PARTIAL_OUTBOUND'
  | 'COMPLETED'
  | 'VOIDED';

export type SalesOutboundStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export type SalesReturnStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export interface SalesOrderItem {
  id: string;
  productCode: string;
  productName: string;
  productBarcode: string;
  productSpec: string;
  unit: string;
  quantity: number;
  price: number;
  priceLevel: '一级' | '二级' | '三级';
  amount: number;
  outboundQuantity: number;
  pendingOutboundQuantity: number;
  remark?: string;
}

export interface SalesOrder {
  id: string;
  customerCode: string;
  customerName: string;
  customerPriceLevel: '一级' | '二级' | '三级';
  warehouseCode: string;
  warehouseName: string;
  orderDate: string;
  status: SalesOrderStatus;
  remark?: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  voidReason?: string;
  items: SalesOrderItem[];
}

export interface SalesOutboundItem {
  id: string;
  productCode: string;
  productName: string;
  productBarcode: string;
  productSpec: string;
  unit: string;
  orderQuantity: number;
  orderPendingQuantity: number;
  outboundQuantity: number;
  price: number;
  amount: number;
  remark?: string;
}

export interface SalesOutbound {
  id: string;
  salesOrderId: string;
  customerCode: string;
  customerName: string;
  warehouseCode: string;
  warehouseName: string;
  outboundDate: string;
  status: SalesOutboundStatus;
  salesRemark?: string;
  remark?: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  items: SalesOutboundItem[];
}

export interface SalesReturnItem {
  id: string;
  productCode: string;
  productName: string;
  productBarcode: string;
  productSpec: string;
  unit: string;
  outboundQuantity: number;
  returnQuantity: number;
  price: number;
  amount: number;
  remark?: string;
}

export interface SalesReturn {
  id: string;
  sourceOutboundId: string;
  sourceSalesOrderId: string;
  customerCode: string;
  customerName: string;
  warehouseCode: string;
  warehouseName: string;
  returnDate: string;
  returnReason: string;
  status: SalesReturnStatus;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  voidReason?: string;
  items: SalesReturnItem[];
}
