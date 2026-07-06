export type PurchaseReturnOutboundStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export interface PurchaseReturnOutboundItem {
  id: string; // 商品明细行ID
  productCode: string; // 商品编码
  productName: string; // 商品名称
  productBarcode: string; // 商品条码
  productSpec: string; // 规格型号
  unit: string; // 单位
  returnQuantity: number; // 退货数量
  outboundQuantity: number; // 退货出库数量
  price: number; // 单价（含税）
  amount: number; // 金额（含税） = outboundQuantity * price
  remark?: string; // 行备注
}

export interface PurchaseReturnOutbound {
  id: string; // 采购退货出库单号 PROYYYYMMDD-XXXX
  sourceReturnId: string; // 来源退货单号 PRXXXX
  supplierCode: string;
  supplierName: string;
  warehouseCode: string;
  warehouseName: string;
  outboundDate: string; // 出库日期
  remark?: string; // 出库备注
  status: PurchaseReturnOutboundStatus; // 单据状态
  
  // 统计汇总字段
  itemCount: number; // 商品种数
  totalQuantity: number; // 出库总数量
  totalAmount: number; // 出库总金额
  
  // 系统字段
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  
  items: PurchaseReturnOutboundItem[];
}
