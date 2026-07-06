export type PurchaseOrderStatus = 'DRAFT' | 'PENDING_AUDIT' | 'PENDING_STOCK_IN' | 'PARTIAL_STOCK_IN' | 'COMPLETED' | 'VOIDED';

export type TaxRate = '0%' | '3%' | '6%' | '9%' | '13%';

export interface PurchaseOrderItem {
  id: string;
  productCode: string;
  productName: string;
  productBarcode: string;
  productSpec: string;
  unit: string;
  quantity: number;
  price: number;
  taxRate: TaxRate | '';
  amount: number;
  receivedQuantity: number;
  pendingQuantity: number;
  remark: string;
}

export interface PurchaseOrder {
  id: string; // 采购单号 POYYYYMMDD-XXXX
  supplierCode: string;
  supplierName: string;
  warehouseCode: string;
  warehouseName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: PurchaseOrderStatus;
  remark?: string;
  
  // 汇总字段
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  
  // 系统字段
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  voidReason?: string;
  
  // 明细
  items: PurchaseOrderItem[];
}

export interface StockInRecord {
  id: string; // 入库单号 SIYYYYMMDD-XXXX
  purchaseOrderId: string;
  stockInDate: string;
  quantity: number;
  operator: string;
  status: string; // "已入库"
}

// 供档案选择的模拟基础数据
export interface Supplier {
  code: string;
  name: string;
}

export interface Warehouse {
  code: string;
  name: string;
}

export interface Product {
  code: string;
  name: string;
  barcode: string;
  spec: string;
  unit: string;
  defaultPurchasePrice: number;
}
