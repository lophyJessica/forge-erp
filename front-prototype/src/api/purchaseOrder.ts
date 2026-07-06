import { 
  PurchaseOrder, 
  PurchaseOrderStatus, 
  PurchaseOrderItem, 
  StockInRecord,
  Supplier,
  Warehouse,
  Product 
} from '../types/purchaseOrder';
import { readTable, replaceTable } from '../db';

// --- Mock 档案数据 ---
export const MOCK_SUPPLIERS: Supplier[] = [
  { code: 'VEND001', name: '北京强盛贸易有限公司' },
  { code: 'VEND002', name: '上海腾飞电子器材厂' },
  { code: 'VEND003', name: '广州力行包装材料公司' },
  { code: 'VEND004', name: '深圳佳美百货批发部' },
  { code: 'VEND005', name: '杭州中盛机械设备有限公司' },
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  { code: 'WH001', name: '北京主仓' },
  { code: 'WH002', name: '上海分仓' },
  { code: 'WH003', name: '广州越秀仓' },
  { code: 'WH004', name: '成都温江仓' },
];

export const MOCK_PRODUCTS: Product[] = [
  { code: 'SKU001', name: '双鸭牌标准型回形针', barcode: '6901234567890', spec: '100枚/盒', unit: '盒', defaultPurchasePrice: 2.5 },
  { code: 'SKU002', name: '晨光按动式中性笔黑色', barcode: '6902345678901', spec: '0.5mm', unit: '支', defaultPurchasePrice: 1.8 },
  { code: 'SKU003', name: '强盛定制纯木浆A4复印纸', barcode: '6903456789012', spec: '80g 500张/包', unit: '包', defaultPurchasePrice: 16.5 },
  { code: 'SKU004', name: '得力多功能计算器', barcode: '6904567890234', spec: '十二位液晶大屏', unit: '台', defaultPurchasePrice: 32.0 },
  { code: 'SKU005', name: '白雪直液式走珠笔红色', barcode: '6905678901235', spec: '0.5mm', unit: '支', defaultPurchasePrice: 1.5 },
  { code: 'SKU006', name: '金士顿64GB高速U盘', barcode: '6906789012346', spec: 'USB 3.2 金属机身', unit: '个', defaultPurchasePrice: 45.0 },
  { code: 'SKU007', name: '公牛插线板3米5位插孔', barcode: '6907890123457', spec: '全长3米 带独立开关', unit: '个', defaultPurchasePrice: 28.5 },
];

// 生成单号的 helper
function generatePONumber(index: number): string {
  const dateStr = '20260704';
  const seq = String(index).padStart(4, '0');
  return `PO${dateStr}-${seq}`;
}

// 模拟初始的采购订单数据
const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO20260615-0001',
    supplierCode: 'VEND001',
    supplierName: '北京强盛贸易有限公司',
    warehouseCode: 'WH001',
    warehouseName: '北京主仓',
    orderDate: '2026-06-15',
    expectedDeliveryDate: '2026-06-25',
    status: 'COMPLETED',
    remark: '首期办公用品大宗采购',
    itemCount: 2,
    totalQuantity: 150,
    totalAmount: 1105.00,
    createdBy: 'Buyer01',
    createdAt: '2026-06-15 10:30:00',
    updatedBy: 'Buyer01',
    updatedAt: '2026-06-15 10:45:00',
    approvedBy: 'Admin',
    approvedAt: '2026-06-15 11:00:00',
    items: [
      {
        id: '1',
        productCode: 'SKU001',
        productName: '双鸭牌标准型回形针',
        productBarcode: '6901234567890',
        productSpec: '100枚/盒',
        unit: '盒',
        quantity: 100,
        price: 2.5,
        taxRate: '13%',
        amount: 250.00,
        receivedQuantity: 100,
        pendingQuantity: 0,
        remark: '主仓备货',
      },
      {
        id: '2',
        productCode: 'SKU003',
        productName: '强盛定制纯木浆A4复印纸',
        productBarcode: '6903456789012',
        productSpec: '80g 500张/包',
        unit: '包',
        quantity: 50,
        price: 17.1,
        taxRate: '13%',
        amount: 855.00,
        receivedQuantity: 50,
        pendingQuantity: 0,
        remark: '经理室领用',
      }
    ]
  },
  {
    id: 'PO20260620-0001',
    supplierCode: 'VEND002',
    supplierName: '上海腾飞电子器材厂',
    warehouseCode: 'WH002',
    warehouseName: '上海分仓',
    orderDate: '2026-06-20',
    expectedDeliveryDate: '2026-06-30',
    status: 'PARTIAL_STOCK_IN',
    remark: '补充电子办公配件',
    itemCount: 2,
    totalQuantity: 30,
    totalAmount: 1185.00,
    createdBy: 'Buyer02',
    createdAt: '2026-06-20 14:20:00',
    updatedBy: 'Buyer02',
    updatedAt: '2026-06-20 14:35:00',
    approvedBy: 'Admin',
    approvedAt: '2026-06-20 15:00:00',
    items: [
      {
        id: '1',
        productCode: 'SKU006',
        productName: '金士顿64GB高速U盘',
        productBarcode: '6906789012346',
        productSpec: 'USB 3.2 金属机身',
        unit: '个',
        quantity: 20,
        price: 45.0,
        taxRate: '13%',
        amount: 900.00,
        receivedQuantity: 15,
        pendingQuantity: 5,
        remark: '销售部礼品',
      },
      {
        id: '2',
        productCode: 'SKU007',
        productName: '公牛插线板3米5位插孔',
        productBarcode: '6907890123457',
        productSpec: '全长3米 带独立开关',
        unit: '个',
        quantity: 10,
        price: 28.5,
        taxRate: '13%',
        amount: 285.00,
        receivedQuantity: 5,
        pendingQuantity: 5,
        remark: '工位扩容',
      }
    ]
  },
  {
    id: 'PO20260701-0001',
    supplierCode: 'VEND003',
    supplierName: '广州力行包装材料公司',
    warehouseCode: 'WH003',
    warehouseName: '广州越秀仓',
    orderDate: '2026-07-01',
    expectedDeliveryDate: '2026-07-08',
    status: 'PENDING_STOCK_IN',
    remark: '补充包材仓储库存',
    itemCount: 1,
    totalQuantity: 200,
    totalAmount: 360.00,
    createdBy: 'Buyer01',
    createdAt: '2026-07-01 09:15:00',
    approvedBy: 'Admin',
    approvedAt: '2026-07-01 10:00:00',
    items: [
      {
        id: '1',
        productCode: 'SKU002',
        productName: '晨光按动式中性笔黑色',
        productBarcode: '6902345678901',
        productSpec: '0.5mm',
        unit: '支',
        quantity: 200,
        price: 1.8,
        taxRate: '3%',
        amount: 360.00,
        receivedQuantity: 0,
        pendingQuantity: 200,
        remark: '',
      }
    ]
  },
  {
    id: 'PO20260702-0001',
    supplierCode: 'VEND004',
    supplierName: '深圳佳美百货批发部',
    warehouseCode: 'WH002',
    warehouseName: '上海分仓',
    orderDate: '2026-07-02',
    expectedDeliveryDate: '2026-07-10',
    status: 'PENDING_AUDIT',
    remark: '采购日常红笔备用',
    itemCount: 1,
    totalQuantity: 300,
    totalAmount: 450.00,
    createdBy: 'Buyer02',
    createdAt: '2026-07-02 16:40:00',
    items: [
      {
        id: '1',
        productCode: 'SKU005',
        productName: '白雪直液式走珠笔红色',
        productBarcode: '6905678901235',
        productSpec: '0.5mm',
        unit: '支',
        quantity: 300,
        price: 1.5,
        taxRate: '0%',
        amount: 450.00,
        receivedQuantity: 0,
        pendingQuantity: 300,
        remark: '阅卷用笔',
      }
    ]
  },
  {
    id: 'PO20260703-0001',
    supplierCode: 'VEND005',
    supplierName: '杭州中盛机械设备有限公司',
    warehouseCode: 'WH004',
    warehouseName: '成都温江仓',
    orderDate: '2026-07-03',
    expectedDeliveryDate: '2026-07-15',
    status: 'DRAFT',
    remark: '计算器补货草稿',
    itemCount: 1,
    totalQuantity: 10,
    totalAmount: 320.00,
    createdBy: 'Buyer01',
    createdAt: '2026-07-03 11:20:00',
    items: [
      {
        id: '1',
        productCode: 'SKU004',
        productName: '得力多功能计算器',
        productBarcode: '6904567890234',
        productSpec: '十二位液晶大屏',
        unit: '台',
        quantity: 10,
        price: 32.0,
        taxRate: '6%',
        amount: 320.00,
        receivedQuantity: 0,
        pendingQuantity: 10,
        remark: '财务科备用',
      }
    ]
  },
  {
    id: 'PO20260703-0002',
    supplierCode: 'VEND001',
    supplierName: '北京强盛贸易有限公司',
    warehouseCode: 'WH001',
    warehouseName: '北京主仓',
    orderDate: '2026-07-03',
    expectedDeliveryDate: '2026-07-05',
    status: 'VOIDED',
    remark: '下单重复，作废处理',
    itemCount: 1,
    totalQuantity: 20,
    totalAmount: 50.00,
    createdBy: 'Buyer01',
    createdAt: '2026-07-03 09:30:00',
    voidReason: '重复录单，供应商已拒绝接收此订单',
    items: [
      {
        id: '1',
        productCode: 'SKU001',
        productName: '双鸭牌标准型回形针',
        productBarcode: '6901234567890',
        productSpec: '100枚/盒',
        unit: '盒',
        quantity: 20,
        price: 2.5,
        taxRate: '13%',
        amount: 50.00,
        receivedQuantity: 0,
        pendingQuantity: 20,
        remark: '',
      }
    ]
  }
];

const INITIAL_STOCK_IN_RECORDS: StockInRecord[] = [
  {
    id: 'SI20260615-0001',
    purchaseOrderId: 'PO20260615-0001',
    stockInDate: '2026-06-16',
    quantity: 150,
    operator: 'Storekeeper01',
    status: '已入库'
  },
  {
    id: 'SI20260620-0001',
    purchaseOrderId: 'PO20260620-0001',
    stockInDate: '2026-06-21',
    quantity: 20,
    operator: 'Storekeeper02',
    status: '已入库'
  }
];

// 初始化 Dexie
export function initializeMockData() {
  readTable('purchaseOrders', INITIAL_ORDERS);
  readTable('purchaseOrderStockInRecords', INITIAL_STOCK_IN_RECORDS);
}

// 辅助函数：从 IndexedDB 镜像获取所有订单
function getLocalOrders(): PurchaseOrder[] {
  initializeMockData();
  return readTable('purchaseOrders', INITIAL_ORDERS);
}

// 辅助函数：将订单存回 IndexedDB
function saveLocalOrders(orders: PurchaseOrder[]) {
  replaceTable('purchaseOrders', orders);
}

// 辅助函数：从 IndexedDB 镜像获取所有入库单
function getLocalStockInRecords(): StockInRecord[] {
  initializeMockData();
  return readTable('purchaseOrderStockInRecords', INITIAL_STOCK_IN_RECORDS);
}

// 辅助函数：将入库单存回 IndexedDB
function saveLocalStockInRecords(records: StockInRecord[]) {
  replaceTable('purchaseOrderStockInRecords', records);
}

// 获取当前时间字符串
function getCurrentDateTime(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// --- API 导出接口 ---

export const purchaseOrderApi = {
  // 1. 获取过滤后的订单列表
  getOrders(filters: {
    status?: PurchaseOrderStatus | 'ALL' | '';
    poNumber?: string;
    supplierCode?: string;
    warehouseCode?: string;
    orderDateStart?: string;
    orderDateEnd?: string;
    expectedDateStart?: string;
    expectedDateEnd?: string;
  } = {}): PurchaseOrder[] {
    let orders = getLocalOrders();

    if (filters.status && filters.status !== 'ALL') {
      orders = orders.filter(o => o.status === filters.status);
    }
    if (filters.poNumber) {
      // 支持换行或英文逗号分隔的多值，进行精确匹配或模糊匹配
      const numbers = filters.poNumber.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
      if (numbers.length > 0) {
        orders = orders.filter(o => numbers.some(num => o.id.toLowerCase().includes(num.toLowerCase())));
      }
    }
    if (filters.supplierCode) {
      orders = orders.filter(o => o.supplierCode === filters.supplierCode);
    }
    if (filters.warehouseCode) {
      orders = orders.filter(o => o.warehouseCode === filters.warehouseCode);
    }
    if (filters.orderDateStart) {
      orders = orders.filter(o => o.orderDate >= filters.orderDateStart!);
    }
    if (filters.orderDateEnd) {
      orders = orders.filter(o => o.orderDate <= filters.orderDateEnd!);
    }
    if (filters.expectedDateStart) {
      orders = orders.filter(o => o.expectedDeliveryDate && o.expectedDeliveryDate >= filters.expectedDateStart!);
    }
    if (filters.expectedDateEnd) {
      orders = orders.filter(o => o.expectedDeliveryDate && o.expectedDeliveryDate <= filters.expectedDateEnd!);
    }

    // 按最后修改时间或创建时间降序排序
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // 2. 获取单个订单
  getOrderById(id: string): PurchaseOrder | null {
    const orders = getLocalOrders();
    return orders.find(o => o.id === id) || null;
  },

  // 3. 创建采购订单
  createOrder(order: Omit<PurchaseOrder, 'id' | 'status' | 'itemCount' | 'totalQuantity' | 'totalAmount' | 'createdBy' | 'createdAt'>): PurchaseOrder {
    const orders = getLocalOrders();
    
    // 生成单号 PO20260704-XXXX
    const nextIndex = orders.filter(o => o.id.startsWith('PO20260704')).length + 1;
    const poId = generatePONumber(nextIndex);

    // 计算汇总字段
    const itemCount = order.items.length;
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = parseFloat(order.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));

    // 明细行补充 receivedQuantity, pendingQuantity, 并计算 amount
    const processedItems = order.items.map(item => ({
      ...item,
      receivedQuantity: 0,
      pendingQuantity: item.quantity,
      amount: parseFloat((item.quantity * item.price).toFixed(2))
    }));

    const newOrder: PurchaseOrder = {
      ...order,
      id: poId,
      status: 'DRAFT',
      itemCount,
      totalQuantity,
      totalAmount,
      createdBy: 'Admin',
      createdAt: getCurrentDateTime(),
      updatedBy: 'Admin',
      updatedAt: getCurrentDateTime(),
      items: processedItems
    };

    orders.unshift(newOrder);
    saveLocalOrders(orders);
    return newOrder;
  },

  // 4. 更新采购订单
  updateOrder(id: string, orderData: Partial<Omit<PurchaseOrder, 'id' | 'createdBy' | 'createdAt'>>): PurchaseOrder {
    const orders = getLocalOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('订单未找到');

    const existing = orders[index];
    
    // 权限校验：已审核通过的订单（待入库、部分入库、已完成等）只能修改采购备注和预计到货日期
    const isLocked = existing.status !== 'DRAFT';
    
    let updatedFields: Partial<PurchaseOrder> = {
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      remark: orderData.remark,
      updatedBy: 'Admin',
      updatedAt: getCurrentDateTime()
    };

    if (!isLocked) {
      // 草稿态可修改任何字段
      const items = orderData.items || existing.items;
      const itemCount = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = parseFloat(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));

      const processedItems = items.map(item => ({
        ...item,
        receivedQuantity: 0,
        pendingQuantity: item.quantity,
        amount: parseFloat((item.quantity * item.price).toFixed(2))
      }));

      updatedFields = {
        ...updatedFields,
        supplierCode: orderData.supplierCode || existing.supplierCode,
        supplierName: orderData.supplierName || existing.supplierName,
        warehouseCode: orderData.warehouseCode || existing.warehouseCode,
        warehouseName: orderData.warehouseName || existing.warehouseName,
        orderDate: orderData.orderDate || existing.orderDate,
        items: processedItems,
        itemCount,
        totalQuantity,
        totalAmount
      };
    } else {
      // 审核通过后，明细行的行备注可修改
      if (orderData.items) {
        updatedFields.items = existing.items.map(existingItem => {
          const matching = orderData.items?.find(it => it.id === existingItem.id);
          return matching ? { ...existingItem, remark: matching.remark } : existingItem;
        });
      }
    }

    const updatedOrder: PurchaseOrder = {
      ...existing,
      ...updatedFields
    } as PurchaseOrder;

    orders[index] = updatedOrder;
    saveLocalOrders(orders);
    return updatedOrder;
  },

  // 5. 物理删除草稿订单
  deleteOrder(id: string) {
    let orders = getLocalOrders();
    const target = orders.find(o => o.id === id);
    if (!target) throw new Error('订单未找到');
    if (target.status !== 'DRAFT') throw new Error('只有草稿态的订单可以删除');

    orders = orders.filter(o => o.id !== id);
    saveLocalOrders(orders);
  },

  // 6. 提交审核 (DRAFT -> PENDING_AUDIT)
  submitOrder(id: string): PurchaseOrder {
    const orders = getLocalOrders();
    const o = orders.find(x => x.id === id);
    if (!o) throw new Error('订单未找到');
    if (o.status !== 'DRAFT') throw new Error('非草稿单据无法提交审核');
    if (o.items.length === 0) throw new Error('商品明细不能为空');

    o.status = 'PENDING_AUDIT';
    o.updatedAt = getCurrentDateTime();
    o.updatedBy = 'Admin';
    saveLocalOrders(orders);
    return o;
  },

  // 7. 审核通过 (PENDING_AUDIT -> PENDING_STOCK_IN)
  approveOrder(id: string): PurchaseOrder {
    const orders = getLocalOrders();
    const o = orders.find(x => x.id === id);
    if (!o) throw new Error('订单未找到');
    if (o.status !== 'PENDING_AUDIT') throw new Error('非待审核单据无法审核通过');

    o.status = 'PENDING_STOCK_IN';
    o.approvedBy = 'Admin';
    o.approvedAt = getCurrentDateTime();
    o.updatedAt = getCurrentDateTime();
    o.updatedBy = 'Admin';
    saveLocalOrders(orders);
    return o;
  },

  // 8. 驳回 (PENDING_AUDIT -> DRAFT)
  rejectOrder(id: string): PurchaseOrder {
    const orders = getLocalOrders();
    const o = orders.find(x => x.id === id);
    if (!o) throw new Error('订单未找到');
    if (o.status !== 'PENDING_AUDIT') throw new Error('非待审核单据无法驳回');

    o.status = 'DRAFT';
    o.approvedBy = undefined;
    o.approvedAt = undefined;
    o.updatedAt = getCurrentDateTime();
    o.updatedBy = 'Admin';
    saveLocalOrders(orders);
    return o;
  },

  // 9. 作废 (PENDING_AUDIT / PENDING_STOCK_IN -> VOIDED)
  voidOrder(id: string, reason: string): PurchaseOrder {
    const orders = getLocalOrders();
    const o = orders.find(x => x.id === id);
    if (!o) throw new Error('订单未找到');
    if (o.status !== 'PENDING_AUDIT' && o.status !== 'PENDING_STOCK_IN') {
      throw new Error('只有待审核或待入库状态的订单可以作废');
    }
    
    // 检查是否有下游已确认入库单
    const records = getLocalStockInRecords().filter(r => r.purchaseOrderId === id);
    if (records.length > 0) {
      throw new Error('已有下游入库记录，无法作废此订单');
    }

    o.status = 'VOIDED';
    o.voidReason = reason || '无说明';
    o.updatedAt = getCurrentDateTime();
    o.updatedBy = 'Admin';
    saveLocalOrders(orders);
    return o;
  },

  // 10. 人工关闭订单/缺量完结 (PARTIAL_STOCK_IN -> COMPLETED)
  closeOrder(id: string): PurchaseOrder {
    const orders = getLocalOrders();
    const o = orders.find(x => x.id === id);
    if (!o) throw new Error('订单未找到');
    if (o.status !== 'PARTIAL_STOCK_IN') throw new Error('只有部分入库的订单允许人工关闭');

    o.status = 'COMPLETED';
    o.updatedAt = getCurrentDateTime();
    o.updatedBy = 'Admin';
    saveLocalOrders(orders);
    return o;
  },

  // 11. 创建关联入库单并回写订单 (生成 SI 前缀入库单，并执行入库数据更新)
  createStockIn(orderId: string, itemsIn: { itemId: string; qty: number }[]): StockInRecord {
    const orders = getLocalOrders();
    const o = orders.find(x => x.id === orderId);
    if (!o) throw new Error('订单未找到');
    if (o.status !== 'PENDING_STOCK_IN' && o.status !== 'PARTIAL_STOCK_IN') {
      throw new Error('当前订单状态不支持入库操作');
    }

    // 校验超收
    for (const inItem of itemsIn) {
      const match = o.items.find(it => it.id === inItem.itemId);
      if (!match) throw new Error('入库商品不存在于原订单中');
      if (inItem.qty > match.pendingQuantity) {
        throw new Error(`商品 ${match.productName} 本次入库数 ${inItem.qty} 超过未入库数 ${match.pendingQuantity}，已被阻断`);
      }
    }

    // 更新数量与重新计算
    let totalInQty = 0;
    o.items = o.items.map(item => {
      const target = itemsIn.find(x => x.itemId === item.id);
      if (target && target.qty > 0) {
        const newReceived = item.receivedQuantity + target.qty;
        const newPending = item.quantity - newReceived;
        totalInQty += target.qty;
        return {
          ...item,
          receivedQuantity: newReceived,
          pendingQuantity: newPending
        };
      }
      return item;
    });

    // 判断新的状态
    const allDone = o.items.every(it => it.pendingQuantity === 0);
    if (allDone) {
      o.status = 'COMPLETED';
    } else {
      o.status = 'PARTIAL_STOCK_IN';
    }
    
    o.updatedAt = getCurrentDateTime();
    o.updatedBy = 'Admin';

    // 存回订单
    saveLocalOrders(orders);

    // 生成入库单记录
    const records = getLocalStockInRecords();
    const nextIndex = records.filter(r => r.id.startsWith('SI20260704')).length + 1;
    const siId = `SI20260704-${String(nextIndex).padStart(4, '0')}`;

    const newRecord: StockInRecord = {
      id: siId,
      purchaseOrderId: orderId,
      stockInDate: getCurrentDateTime().split(' ')[0],
      quantity: totalInQty,
      operator: 'Storekeeper01',
      status: '已入库'
    };

    records.unshift(newRecord);
    saveLocalStockInRecords(records);

    return newRecord;
  },

  // 12. 获取指定订单关联的入库单
  getStockInRecords(orderId: string): StockInRecord[] {
    const records = getLocalStockInRecords();
    return records.filter(r => r.purchaseOrderId === orderId);
  },

  // 13. 模拟导入数据
  importOrders(imported: PurchaseOrder[]) {
    const orders = getLocalOrders();
    // 合并订单
    saveLocalOrders([...imported, ...orders]);
  }
};
