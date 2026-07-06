export type PurchaseReturnStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export interface PurchaseReturnItem {
  id: string; // 商品明细行ID
  productCode: string; // 商品编码
  productName: string; // 商品名称
  productBarcode: string; // 商品条码
  productSpec: string; // 规格型号
  unit: string; // 单位
  receivedQuantity: number; // 已入库数量
  returnQuantity: number; // 退货数量
  price: number; // 单价（含税）
  amount: number; // 金额（含税） = returnQuantity * price
  remark?: string; // 行备注
}

export interface PurchaseReturn {
  id: string; // 采购退货单号 PRYYYYMMDD-XXXX
  sourceStockInId: string; // 来源入库单号 PIXXXX
  supplierCode: string;
  supplierName: string;
  warehouseCode: string;
  warehouseName: string;
  returnDate: string; // 退货日期
  returnReason: string; // 退货原因
  status: PurchaseReturnStatus; // 退货状态
  
  // 统计汇总字段
  itemCount: number; // 商品种数
  totalQuantity: number; // 退货总数量
  totalAmount: number; // 退货总金额
  
  // 系统字段
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  
  items: PurchaseReturnItem[];
}
