import { StockIn, StockInItem, StockInStatus, InventoryFlow, InstantStock } from '../types/stockIn';
import { PurchaseOrder } from '../types/purchaseOrder';
import { readTable, replaceTable, type AccountPayable } from '../db';
import { initializeMockData } from './purchaseOrder';

function getLocalInstantStocks(): InstantStock[] {
  return readTable('instantStocks', getInitialInstantStocks());
}

function getInitialInstantStocks(): InstantStock[] {
  return [
    {
      id: 'SKU001-WH001-NONE',
      productCode: 'SKU001',
      productName: '双鸭牌标准型回形针',
      productSpec: '100枚/盒',
      unit: '盒',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      batchNo: '-',
      quantity: 250,
      occupied: 10,
      available: 240,
      safetyStock: 50,
      lastChangedAt: '2026-07-04 10:15:30'
    },
    {
      id: 'SKU006-WH002-NONE',
      productCode: 'SKU006',
      productName: '金士顿64GB高速U盘',
      productSpec: 'USB 3.2 金属机身',
      unit: '个',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      batchNo: '-',
      quantity: 15,
      occupied: 5,
      available: 10,
      safetyStock: 30,
      lastChangedAt: '2026-07-04 10:20:00'
    },
    {
      id: 'SKU004-WH001-NONE',
      productCode: 'SKU004',
      productName: '得力多功能计算器',
      productSpec: '十二位液晶大屏',
      unit: '台',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      batchNo: '-',
      quantity: 0,
      occupied: 0,
      available: 0,
      safetyStock: 20,
      lastChangedAt: '2026-07-04 15:00:00'
    },
    {
      id: 'SKU007-WH002-NONE',
      productCode: 'SKU007',
      productName: '公牛插线板3米5位插孔',
      productSpec: '全长3米 带独立开关',
      unit: '个',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      batchNo: '-',
      quantity: -2,
      occupied: 0,
      available: 0,
      safetyStock: 5,
      lastChangedAt: '2026-07-04 16:30:00'
    },
    {
      id: 'SKU002-WH003-B2026070401',
      productCode: 'SKU002',
      productName: '晨光按动式中性笔黑色',
      productSpec: '0.5mm',
      unit: '支',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      batchNo: 'BATCH2026070401',
      quantity: 100,
      occupied: 10,
      available: 90,
      safetyStock: 50,
      lastChangedAt: '2026-07-04 17:00:00'
    },
    {
      id: 'SKU003-WH001-NONE',
      productCode: 'SKU003',
      productName: '强盛定制纯木浆A4复印纸',
      productSpec: '80g 500张/包',
      unit: '包',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      batchNo: '-',
      quantity: 118,
      occupied: 18,
      available: 100,
      safetyStock: 50,
      lastChangedAt: '2026-07-04 14:00:00'
    }
  ];
}

function getLocalInventoryFlows(): InventoryFlow[] {
  return readTable('inventoryFlows', getInitialInventoryFlows());
}

function getInitialInventoryFlows(): InventoryFlow[] {
  return [
    {
      id: 'FL20260704-00000001',
      createdAt: '2026-07-04 10:15:30',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      productCode: 'SKU001',
      productName: '双鸭牌标准型回形针',
      productSpec: '100枚/盒',
      unit: '盒',
      changeType: 'PI',
      quantity: 100,
      postQuantity: 250,
      sourceId: 'PI20260615-0001',
      operator: 'Storekeeper01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000002',
      createdAt: '2026-07-04 10:20:00',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      productCode: 'SKU006',
      productName: '金士顿64GB高速U盘',
      productSpec: 'USB 3.2 金属机身',
      unit: '个',
      changeType: 'PI',
      quantity: 15,
      postQuantity: 15,
      sourceId: 'PI20260620-0001',
      operator: 'Storekeeper01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000003',
      createdAt: '2026-07-04 11:00:00',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      productCode: 'SKU006',
      productName: '金士顿64GB高速U盘',
      productSpec: 'USB 3.2 金属机身',
      unit: '个',
      changeType: 'SOO',
      quantity: -5,
      postQuantity: 10,
      sourceId: 'SOO20260704-0001',
      operator: 'Sales01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000004',
      createdAt: '2026-07-04 11:30:00',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      productCode: 'SKU003',
      productName: '强盛定制纯木浆A4复印纸',
      productSpec: '80g 500张/包',
      unit: '包',
      changeType: 'PI',
      quantity: 50,
      postQuantity: 120,
      sourceId: 'PI20260615-0001',
      operator: 'Storekeeper01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000005',
      createdAt: '2026-07-04 14:00:00',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      productCode: 'SKU003',
      productName: '强盛定制纯木浆A4复印纸',
      productSpec: '80g 500张/包',
      unit: '包',
      changeType: 'RS',
      quantity: -2,
      postQuantity: 118,
      sourceId: 'RS20260704-0012',
      operator: 'Cashier01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000006',
      createdAt: '2026-07-04 15:00:00',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      productCode: 'SKU004',
      productName: '得力多功能计算器',
      productSpec: '十二位液晶大屏',
      unit: '台',
      changeType: 'BL',
      quantity: -1,
      postQuantity: 9,
      sourceId: 'BL20260704-0001',
      operator: 'Storekeeper01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000007',
      createdAt: '2026-07-04 16:30:00',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      productCode: 'SKU007',
      productName: '公牛插线板3米5位插孔',
      productSpec: '全长3米 带独立开关',
      unit: '个',
      changeType: 'PRO',
      quantity: -2,
      postQuantity: 3,
      sourceId: 'PRO20260704-0001',
      operator: 'Buyer01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000008',
      createdAt: '2026-07-04 17:00:00',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      productCode: 'SKU002',
      productName: '晨光按动式中性笔黑色',
      productSpec: '0.5mm',
      unit: '支',
      changeType: 'PI',
      quantity: 100,
      postQuantity: 100,
      sourceId: 'PI20260704-0004',
      operator: 'Storekeeper02',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000009',
      createdAt: '2026-07-04 17:15:00',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      productCode: 'SKU002',
      productName: '晨光按动式中性笔黑色',
      productSpec: '0.5mm',
      unit: '支',
      changeType: 'TR_OUT',
      quantity: -30,
      postQuantity: 70,
      sourceId: 'TR20260704-0001',
      operator: 'Storekeeper02',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000010',
      createdAt: '2026-07-04 17:30:00',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      productCode: 'SKU002',
      productName: '晨光按动式中性笔黑色',
      productSpec: '0.5mm',
      unit: '支',
      changeType: 'TR_IN',
      quantity: 30,
      postQuantity: 30,
      sourceId: 'TR20260704-0001',
      operator: 'Storekeeper01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000011',
      createdAt: '2026-07-04 18:00:00',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      productCode: 'SKU001',
      productName: '双鸭牌标准型回形针',
      productSpec: '100枚/盒',
      unit: '盒',
      changeType: 'SR',
      quantity: 5,
      postQuantity: 55,
      sourceId: 'SR20260704-0001',
      operator: 'Sales01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000012',
      createdAt: '2026-07-04 18:30:00',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      productCode: 'SKU005',
      productName: '白雪直液式走珠笔红色',
      productSpec: '0.5mm',
      unit: '支',
      changeType: 'CK_IN',
      quantity: 10,
      postQuantity: 210,
      sourceId: 'CK20260704-0001',
      operator: 'Storekeeper01',
      batchNo: '-'
    },
    {
      id: 'FL20260704-00000013',
      createdAt: '2026-07-04 18:45:00',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      productCode: 'SKU005',
      productName: '白雪直液式走珠笔红色',
      productSpec: '0.5mm',
      unit: '支',
      changeType: 'CK_OUT',
      quantity: -3,
      postQuantity: 207,
      sourceId: 'CK20260704-0001',
      operator: 'Storekeeper01',
      batchNo: '-'
    }
  ];
}

// --- 获取当前时间 YYYY-MM-DD HH:mm:ss ---
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

// --- 辅助方法 ---
function getLocalStockIns(): StockIn[] {
  return readTable('stockInRecords', getInitialStockIns());
}

function saveLocalStockIns(stockIns: StockIn[]) {
  replaceTable('stockInRecords', stockIns);
}

function getLocalOrders(): PurchaseOrder[] {
  initializeMockData();
  return readTable('purchaseOrders', []);
}

function saveLocalOrders(orders: PurchaseOrder[]) {
  replaceTable('purchaseOrders', orders);
}

// --- 初始化 7 条以上的 Mock 采购入库单 ---
function getInitialStockIns(): StockIn[] {
  return [
    {
      id: 'PI20260615-0001',
      purchaseOrderId: 'PO20260615-0001',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      stockInDate: '2026-06-15',
      status: 'CONFIRMED',
      purchaseRemark: '首期办公用品大宗采购',
      remark: '已点清，全数入库完毕',
      itemCount: 2,
      totalQuantity: 150,
      totalAmount: 1105.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-06-15 11:30:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-06-15 11:40:00',
      confirmedBy: 'Storekeeper01',
      confirmedAt: '2026-06-15 11:45:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          price: 2.5,
          taxRate: '13%',
          orderQuantity: 100,
          orderPendingQuantity: 100,
          receivedQuantity: 100,
          stockInQuantity: 100,
          amount: 250.00,
          remark: '数量一致'
        },
        {
          id: '2',
          productCode: 'SKU003',
          productName: '强盛定制纯木浆A4复印纸',
          productBarcode: '6903456789012',
          productSpec: '80g 500张/包',
          unit: '包',
          price: 17.1,
          taxRate: '13%',
          orderQuantity: 50,
          orderPendingQuantity: 50,
          receivedQuantity: 50,
          stockInQuantity: 50,
          amount: 855.00,
          remark: '无破损'
        }
      ]
    },
    {
      id: 'PI20260620-0001',
      purchaseOrderId: 'PO20260620-0001',
      supplierCode: 'VEND002',
      supplierName: '上海腾飞电子器材厂',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      stockInDate: '2026-06-20',
      status: 'CONFIRMED',
      purchaseRemark: '补充电子办公配件',
      remark: '首批到货收货，U盘缺货5个，插线板缺货5个',
      itemCount: 2,
      totalQuantity: 20,
      totalAmount: 817.50,
      createdBy: 'Storekeeper01',
      createdAt: '2026-06-20 15:30:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-06-20 15:40:00',
      confirmedBy: 'Storekeeper01',
      confirmedAt: '2026-06-20 15:45:00',
      items: [
        {
          id: '1',
          productCode: 'SKU006',
          productName: '金士顿64GB高速U盘',
          productBarcode: '6906789012346',
          productSpec: 'USB 3.2 金属机身',
          unit: '个',
          price: 45.0,
          taxRate: '13%',
          orderQuantity: 20,
          orderPendingQuantity: 20,
          receivedQuantity: 15,
          stockInQuantity: 15,
          amount: 675.00,
          remark: '供应商缺货，后续补发'
        },
        {
          id: '2',
          productCode: 'SKU007',
          productName: '公牛插线板3米5位插孔',
          productBarcode: '6907890123457',
          productSpec: '全长3米 带独立开关',
          unit: '个',
          price: 28.5,
          taxRate: '13%',
          orderQuantity: 10,
          orderPendingQuantity: 10,
          receivedQuantity: 5,
          stockInQuantity: 5,
          amount: 142.50,
          remark: '包装微损，商品完好'
        }
      ]
    },
    {
      id: 'PI20260704-0001',
      purchaseOrderId: 'PO20260620-0001',
      supplierCode: 'VEND002',
      supplierName: '上海腾飞电子器材厂',
      warehouseCode: 'WH002',
      warehouseName: '上海分仓',
      stockInDate: '2026-07-04',
      status: 'DRAFT',
      purchaseRemark: '补充电子办公配件',
      remark: '准备收尾货',
      itemCount: 2,
      totalQuantity: 10,
      totalAmount: 367.50,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 10:00:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-07-04 10:15:00',
      items: [
        {
          id: '1',
          productCode: 'SKU006',
          productName: '金士顿64GB高速U盘',
          productBarcode: '6906789012346',
          productSpec: 'USB 3.2 金属机身',
          unit: '个',
          price: 45.0,
          taxRate: '13%',
          orderQuantity: 20,
          orderPendingQuantity: 5,
          receivedQuantity: 5,
          stockInQuantity: 5,
          amount: 225.00,
          remark: '尾货补齐'
        },
        {
          id: '2',
          productCode: 'SKU007',
          productName: '公牛插线板3米5位插孔',
          productBarcode: '6907890123457',
          productSpec: '全长3米 带独立开关',
          unit: '个',
          price: 28.5,
          taxRate: '13%',
          orderQuantity: 10,
          orderPendingQuantity: 5,
          receivedQuantity: 5,
          stockInQuantity: 5,
          amount: 142.50,
          remark: '尾货补齐'
        }
      ]
    },
    {
      id: 'PI20260704-0002',
      purchaseOrderId: 'PO20260701-0001',
      supplierCode: 'VEND003',
      supplierName: '广州力行包装材料公司',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      stockInDate: '2026-07-04',
      status: 'DRAFT',
      purchaseRemark: '补充包材仓储库存',
      remark: '笔到货点数中',
      itemCount: 1,
      totalQuantity: 200,
      totalAmount: 360.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 10:30:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-07-04 10:30:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          price: 1.8,
          taxRate: '3%',
          orderQuantity: 200,
          orderPendingQuantity: 200,
          receivedQuantity: 200,
          stockInQuantity: 200,
          amount: 360.00,
          remark: ''
        }
      ]
    },
    {
      id: 'PI20260704-0003',
      purchaseOrderId: 'PO20260701-0001',
      supplierCode: 'VEND003',
      supplierName: '广州力行包装材料公司',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      stockInDate: '2026-07-04',
      status: 'VOIDED',
      purchaseRemark: '补充包材仓储库存',
      remark: '下推时填错，作废重新搞',
      itemCount: 1,
      totalQuantity: 200,
      totalAmount: 360.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 09:00:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-07-04 09:10:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          price: 1.8,
          taxRate: '3%',
          orderQuantity: 200,
          orderPendingQuantity: 200,
          receivedQuantity: 200,
          stockInQuantity: 200,
          amount: 360.00,
          remark: ''
        }
      ]
    },
    {
      id: 'PI20260704-0004',
      purchaseOrderId: 'PO20260701-0001',
      supplierCode: 'VEND003',
      supplierName: '广州力行包装材料公司',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      stockInDate: '2026-07-02',
      status: 'CONFIRMED',
      purchaseRemark: '补充包材仓储库存',
      remark: '模拟已确认的笔',
      itemCount: 1,
      totalQuantity: 100,
      totalAmount: 180.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-02 14:00:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-07-02 14:10:00',
      confirmedBy: 'Storekeeper01',
      confirmedAt: '2026-07-02 14:15:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          price: 1.8,
          taxRate: '3%',
          orderQuantity: 200,
          orderPendingQuantity: 200,
          receivedQuantity: 100,
          stockInQuantity: 100,
          amount: 180.00,
          remark: '先收100支'
        }
      ]
    },
    {
      id: 'PI20260704-0005',
      purchaseOrderId: 'PO20260615-0001',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      stockInDate: '2026-06-16',
      status: 'CONFIRMED',
      purchaseRemark: '首期办公用品大宗采购',
      remark: '补充记录',
      itemCount: 1,
      totalQuantity: 50,
      totalAmount: 125.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-06-16 09:30:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-06-16 09:40:00',
      confirmedBy: 'Storekeeper01',
      confirmedAt: '2026-06-16 09:45:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          price: 2.5,
          taxRate: '13%',
          orderQuantity: 100,
          orderPendingQuantity: 100,
          receivedQuantity: 50,
          stockInQuantity: 50,
          amount: 125.00,
          remark: '前批'
        }
      ]
    }
  ];
}

// --- API 业务接口 ---
export const stockInApi = {
  // 1. 获取过滤后的入库单列表
  getStockIns(filters: {
    status?: StockInStatus | 'ALL' | '';
    piNumber?: string;
    poNumber?: string;
    supplierCode?: string;
    warehouseCode?: string;
    stockInDateStart?: string;
    stockInDateEnd?: string;
    updatedDateStart?: string;
    updatedDateEnd?: string;
  } = {}): StockIn[] {
    let stockIns = getLocalStockIns();

    if (filters.status && filters.status !== 'ALL') {
      stockIns = stockIns.filter(x => x.status === filters.status);
    }
    if (filters.piNumber) {
      stockIns = stockIns.filter(x => x.id.toLowerCase().includes(filters.piNumber!.toLowerCase().trim()));
    }
    if (filters.poNumber) {
      stockIns = stockIns.filter(x => x.purchaseOrderId.toLowerCase().includes(filters.poNumber!.toLowerCase().trim()));
    }
    if (filters.supplierCode) {
      stockIns = stockIns.filter(x => x.supplierCode === filters.supplierCode);
    }
    if (filters.warehouseCode) {
      stockIns = stockIns.filter(x => x.warehouseCode === filters.warehouseCode);
    }
    if (filters.stockInDateStart) {
      stockIns = stockIns.filter(x => x.stockInDate >= filters.stockInDateStart!);
    }
    if (filters.stockInDateEnd) {
      stockIns = stockIns.filter(x => x.stockInDate <= filters.stockInDateEnd!);
    }
    if (filters.updatedDateStart) {
      stockIns = stockIns.filter(x => (x.updatedAt || x.createdAt).split(' ')[0] >= filters.updatedDateStart!);
    }
    if (filters.updatedDateEnd) {
      stockIns = stockIns.filter(x => (x.updatedAt || x.createdAt).split(' ')[0] <= filters.updatedDateEnd!);
    }

    return stockIns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // 2. 根据ID获取入库单
  getStockInById(id: string): StockIn | null {
    const list = getLocalStockIns();
    return list.find(x => x.id === id) || null;
  },

  // 3. 从PO下推生成入库单草稿
  createStockInFromPO(poId: string): StockIn {
    const orders = getLocalOrders();
    const po = orders.find(o => o.id === poId);
    if (!po) throw new Error(`采购订单 ${poId} 不存在`);
    if (po.status !== 'PENDING_STOCK_IN' && po.status !== 'PARTIAL_STOCK_IN') {
      throw new Error(`采购订单 ${poId} 当前状态为【${po.status}】，不支持入库操作`);
    }

    // 过滤出未入库数量 > 0 的明细行
    const pendingItems = po.items.filter(it => it.pendingQuantity > 0);
    if (pendingItems.length === 0) {
      throw new Error(`采购订单 ${poId} 已无未入库商品余额，无法下推`);
    }

    const items: StockInItem[] = pendingItems.map(it => {
      return {
        id: it.id,
        productCode: it.productCode,
        productName: it.productName,
        productBarcode: it.productBarcode,
        productSpec: it.productSpec,
        unit: it.unit,
        price: it.price,
        taxRate: it.taxRate as string,
        orderQuantity: it.quantity,
        orderPendingQuantity: it.pendingQuantity,
        receivedQuantity: it.pendingQuantity, // 默认实收 = 未入库数
        stockInQuantity: it.pendingQuantity, // 默认入库 = 未入库数
        amount: parseFloat((it.pendingQuantity * it.price).toFixed(2)),
        remark: ''
      };
    });

    const stockIns = getLocalStockIns();
    const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = `PI${todayStr}`;
    const nextIndex = stockIns.filter(x => x.id.startsWith(prefix)).length + 1;
    const piId = `${prefix}-${String(nextIndex).padStart(4, '0')}`;

    const totalQuantity = items.reduce((sum, item) => sum + item.stockInQuantity, 0);
    const totalAmount = parseFloat(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));

    const newStockIn: StockIn = {
      id: piId,
      purchaseOrderId: po.id,
      supplierCode: po.supplierCode,
      supplierName: po.supplierName,
      warehouseCode: po.warehouseCode,
      warehouseName: po.warehouseName,
      stockInDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      purchaseRemark: po.remark || '',
      remark: '',
      itemCount: items.length,
      totalQuantity,
      totalAmount,
      createdBy: 'Storekeeper01',
      createdAt: getCurrentDateTime(),
      updatedBy: 'Storekeeper01',
      updatedAt: getCurrentDateTime(),
      items
    };

    stockIns.unshift(newStockIn);
    saveLocalStockIns(stockIns);
    return newStockIn;
  },

  // 4. 保存草稿（宽松校验，实收>未入库/入库>实收不强阻断，但在编辑时给出警告或仅在此次更新明细）
  saveDraft(id: string, updateData: {
    stockInDate: string;
    remark?: string;
    items: { id: string; receivedQuantity: number; stockInQuantity: number; remark?: string }[];
  }): StockIn {
    const list = getLocalStockIns();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('入库单不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿态单据允许编辑修改');

    const draft = list[idx];
    draft.stockInDate = updateData.stockInDate;
    draft.remark = updateData.remark;

    draft.items = draft.items.map(item => {
      const match = updateData.items.find(x => x.id === item.id);
      if (match) {
        const receivedQuantity = match.receivedQuantity;
        const stockInQuantity = match.stockInQuantity;
        return {
          ...item,
          receivedQuantity,
          stockInQuantity,
          amount: parseFloat((stockInQuantity * item.price).toFixed(2)),
          remark: match.remark
        };
      }
      return item;
    });

    draft.itemCount = draft.items.length;
    draft.totalQuantity = draft.items.reduce((sum, it) => sum + it.stockInQuantity, 0);
    draft.totalAmount = parseFloat(draft.items.reduce((sum, it) => sum + it.amount, 0).toFixed(2));
    draft.updatedAt = getCurrentDateTime();
    draft.updatedBy = 'Storekeeper01';

    list[idx] = draft;
    saveLocalStockIns(list);
    return draft;
  },

  // 5. 确认入库（全量校验 + 拦截，状态流转为已确认，回写PO，写库存流水FL，写应付AP）
  confirmStockIn(id: string, updateData?: {
    stockInDate: string;
    remark?: string;
    items: { id: string; receivedQuantity: number; stockInQuantity: number; remark?: string }[];
  }): StockIn {
    const list = getLocalStockIns();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('入库单不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿状态的单据可以确认入库');

    let draft = list[idx];

    // 如果传入了更新的数据，先保存至草稿中
    if (updateData) {
      draft.stockInDate = updateData.stockInDate;
      draft.remark = updateData.remark;
      draft.items = draft.items.map(item => {
        const match = updateData.items.find(x => x.id === item.id);
        if (match) {
          return {
            ...item,
            receivedQuantity: match.receivedQuantity,
            stockInQuantity: match.stockInQuantity,
            amount: parseFloat((match.stockInQuantity * item.price).toFixed(2)),
            remark: match.remark
          };
        }
        return item;
      });
      draft.itemCount = draft.items.length;
      draft.totalQuantity = draft.items.reduce((sum, it) => sum + it.stockInQuantity, 0);
      draft.totalAmount = parseFloat(draft.items.reduce((sum, it) => sum + it.amount, 0).toFixed(2));
    }

    // --- 全量业务校验 ---
    // VAL02: 至少包含1行商品
    if (draft.items.length === 0) {
      throw new Error('明细行不能为空，请至少保留一行明细');
    }
    // VAL03: 入库日期必填，且不得晚于当前日期
    if (!draft.stockInDate) {
      throw new Error('入库日期必须填写');
    }
    if (new Date(draft.stockInDate) > new Date()) {
      throw new Error('入库日期不合法，不能选择未来的日期');
    }

    // VAL01 & VAL11 & VAL12: 数量口径拦截
    for (const item of draft.items) {
      if (item.receivedQuantity <= 0 || item.stockInQuantity <= 0) {
        throw new Error(`商品 ${item.productName} 的实收/入库数量格式不正确，必须为大于0的整数`);
      }
      if (item.stockInQuantity > item.receivedQuantity) {
        throw new Error(`商品 ${item.productName} 确认失败：入库数量不能大于实际到货的实收数量`);
      }
      if (item.receivedQuantity > item.orderPendingQuantity) {
        throw new Error(`商品 ${item.productName} 确认失败：到货数量超过了采购订单尚未入库的余额 (${item.orderPendingQuantity}件)`);
      }
    }

    // VAL13: 前置订单状态校验
    const orders = getLocalOrders();
    const poIdx = orders.findIndex(o => o.id === draft.purchaseOrderId);
    if (poIdx === -1) {
      throw new Error('关联的采购订单不存在');
    }
    const po = orders[poIdx];
    if (['COMPLETED', 'VOIDED'].includes(po.status)) {
      throw new Error(`确认失败，关联的采购订单【${po.id}】当前已被关闭或作废`);
    }

    // --- 校验全部通过，开始执行确认流转 ---
    draft.status = 'CONFIRMED';
    draft.confirmedBy = 'Storekeeper01';
    draft.confirmedAt = getCurrentDateTime();
    draft.updatedAt = getCurrentDateTime();
    draft.updatedBy = 'Storekeeper01';

    // 1. 回写 PO 商品明细行的累计入库量与未入库量
    po.items = po.items.map(poItem => {
      const match = draft.items.find(piItem => piItem.id === poItem.id);
      if (match) {
        const newReceived = poItem.receivedQuantity + match.stockInQuantity;
        const newPending = Math.max(0, poItem.quantity - newReceived);
        return {
          ...poItem,
          receivedQuantity: newReceived,
          pendingQuantity: newPending
        };
      }
      return poItem;
    });

    // 2. 联动更新 PO 的单据状态
    const allPendingZero = po.items.every(it => it.pendingQuantity === 0);
    if (allPendingZero) {
      po.status = 'COMPLETED';
    } else {
      po.status = 'PARTIAL_STOCK_IN';
    }
    po.updatedAt = getCurrentDateTime();
    po.updatedBy = 'Admin';
    orders[poIdx] = po;
    saveLocalOrders(orders);

    // 3. 产生库存流水记录 (FL)
    const flRecords = getLocalInventoryFlows();
    draft.items.forEach(it => {
      const flowId = `FL${getCurrentDateTime().split(' ')[0].replace(/-/g, '')}-${String(flRecords.length + 1).padStart(8, '0')}`;
      flRecords.unshift({
        id: flowId,
        createdAt: getCurrentDateTime(),
        warehouseCode: draft.warehouseCode,
        warehouseName: draft.warehouseName,
        productCode: it.productCode,
        productName: it.productName,
        productSpec: it.productSpec,
        unit: it.unit,
        changeType: 'PI',
        quantity: it.stockInQuantity,
        postQuantity: 100 + it.stockInQuantity,
        sourceId: draft.id,
        operator: draft.confirmedBy || 'Storekeeper01',
        batchNo: '-'
      });
    });
    replaceTable('inventoryFlows', flRecords);

    // 4. 产生财务应付款记录 (AP)
    const apRecords = readTable<AccountPayable>('accountsPayable', []);
    const apId = `AP${getCurrentDateTime().split(' ')[0].replace(/-/g, '')}-${String(apRecords.length + 1).padStart(4, '0')}`;
    apRecords.unshift({
      id: apId,
      stockInId: draft.id,
      supplierName: draft.supplierName,
      amount: draft.totalAmount,
      status: 'UNPAID',
      createdAt: getCurrentDateTime()
    });
    replaceTable('accountsPayable', apRecords);

    // 5. 保存入库单
    list[idx] = draft;
    saveLocalStockIns(list);

    return draft;
  },

  // 6. 手动作废草稿
  voidStockIn(id: string): StockIn {
    const list = getLocalStockIns();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('入库单不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿状态的入库单允许作废');

    const draft = list[idx];
    draft.status = 'VOIDED';
    draft.updatedAt = getCurrentDateTime();
    draft.updatedBy = 'Storekeeper01';

    list[idx] = draft;
    saveLocalStockIns(list);
    return draft;
  },

  // 7. 物理删除草稿
  deleteStockIn(id: string) {
    let list = getLocalStockIns();
    const target = list.find(x => x.id === id);
    if (!target) throw new Error('入库单不存在');
    if (target.status !== 'DRAFT') throw new Error('只有草稿状态的入库单可以删除');

    list = list.filter(x => x.id !== id);
    saveLocalStockIns(list);
  },

  // 8. 获取指定 PO 关联的所有入库单记录
  getStockInsByPO(poId: string): StockIn[] {
    const list = getLocalStockIns();
    return list.filter(x => x.purchaseOrderId === poId);
  },

  // 9. 获取库存流水明细
  getInventoryFlows(stockInId: string): InventoryFlow[] {
    const flRecords = getLocalInventoryFlows();
    return flRecords.filter((x: any) => x.sourceId === stockInId);
  },

  // 10. 获取应付账款明细
  getPayableRecords(stockInId: string): any[] {
    const apRecords = readTable<AccountPayable>('accountsPayable', []);
    return apRecords.filter((x: any) => x.stockInId === stockInId);
  },

  // 11. 全局库存流水筛选
  getGlobalInventoryFlows(filters: {
    warehouseCode?: string;
    productCode?: string;
    changeType?: string;
    direction?: 'IN' | 'OUT' | '';
    dateStart?: string;
    dateEnd?: string;
    sourceId?: string;
  } = {}): InventoryFlow[] {
    let list = getLocalInventoryFlows();

    if (filters.warehouseCode) {
      list = list.filter(x => x.warehouseCode === filters.warehouseCode);
    }
    if (filters.productCode) {
      list = list.filter(x => x.productCode === filters.productCode);
    }
    if (filters.changeType) {
      list = list.filter(x => x.changeType === filters.changeType);
    }
    if (filters.direction === 'IN') {
      list = list.filter(x => x.quantity > 0);
    } else if (filters.direction === 'OUT') {
      list = list.filter(x => x.quantity < 0);
    }
    if (filters.dateStart) {
      list = list.filter(x => x.createdAt.split(' ')[0] >= filters.dateStart!);
    }
    if (filters.dateEnd) {
      list = list.filter(x => x.createdAt.split(' ')[0] <= filters.dateEnd!);
    }
    if (filters.sourceId) {
      list = list.filter(x => x.sourceId.toLowerCase().includes(filters.sourceId!.toLowerCase().trim()));
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // 12. 即时库存多条件查询
  getInstantStocks(filters: {
    warehouseCode?: string;
    productCode?: string;
    batchNo?: string;
    hideZeroStock?: boolean;
  } = {}): InstantStock[] {
    let list = getLocalInstantStocks();

    if (filters.warehouseCode) {
      list = list.filter(x => x.warehouseCode === filters.warehouseCode);
    }
    if (filters.productCode) {
      list = list.filter(x => x.productCode === filters.productCode);
    }
    if (filters.batchNo) {
      list = list.filter(x => x.batchNo.toLowerCase().startsWith(filters.batchNo!.toLowerCase().trim()));
    }
    if (filters.hideZeroStock) {
      list = list.filter(x => x.quantity > 0);
    }

    return list.sort((a, b) => b.lastChangedAt.localeCompare(a.lastChangedAt));
  }
};
