export type StockInStatus = 'DRAFT' | 'CONFIRMED' | 'VOIDED';

export interface StockInItem {
  id: string; // 商品明细行ID
  productCode: string; // 商品编码
  productName: string; // 商品名称
  productBarcode: string; // 商品条码
  productSpec: string; // 规格型号
  unit: string; // 单位
  price: number; // 单价（含税）
  taxRate: string; // 税率
  orderQuantity: number; // 订单数量
  orderPendingQuantity: number; // 订单未入库数量
  receivedQuantity: number; // 实收数量
  stockInQuantity: number; // 入库数量
  amount: number; // 金额（含税） = stockInQuantity * price
  remark?: string; // 行备注
}

export interface StockIn {
  id: string; // 采购入库单号 PIYYYYMMDD-XXXX
  purchaseOrderId: string; // 来源采购单号
  supplierCode: string;
  supplierName: string;
  warehouseCode: string;
  warehouseName: string;
  stockInDate: string; // 入库日期
  status: StockInStatus; // 入库状态
  purchaseRemark?: string; // 采购备注
  remark?: string; // 入库备注
  
  // 统计汇总字段
  itemCount: number; // 商品种数
  totalQuantity: number; // 入库总数量
  totalAmount: number; // 入库总金额
  
  // 系统字段
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  confirmedBy?: string; // 确认人
  confirmedAt?: string; // 确认时间
  
  items: StockInItem[];
}

export interface InventoryFlow {
  id: string; // FL{YYYYMMDD}-{8位序号}
  createdAt: string; // 发生时间 (YYYY-MM-DD HH:mm:ss)
  warehouseCode: string;
  warehouseName: string;
  productCode: string;
  productName: string;
  productSpec: string;
  unit: string;
  changeType: 'PI' | 'PRO' | 'SOO' | 'SR' | 'RS' | 'TR_OUT' | 'TR_IN' | 'BL' | 'CK_IN' | 'CK_OUT'; // 变动类型
  quantity: number; // 变动数量（入库为正数，出库为负数）
  postQuantity: number; // 变动后现存量
  sourceId: string; // 来源单号
  operator: string; // 操作人
  batchNo?: string; // 批次号
}

export interface InstantStock {
  id: string; // SKU+WH+BATCH
  productCode: string;
  productName: string;
  productSpec: string;
  unit: string;
  warehouseCode: string;
  warehouseName: string;
  batchNo: string; // 批次号，默认 "-"
  quantity: number; // 现存量
  occupied: number; // 占用量
  available: number; // 可用量 = 现存量 - 占用量
  safetyStock: number | '-'; // 安全库存量
  lastChangedAt: string; // 最近变动时间 YYYY-MM-DD HH:mm:ss
}
