import { baseDataApi } from './baseData';
import { readTable, replaceTable, type AccountReceivable } from '../db';
import type { InstantStock, InventoryFlow } from '../types/stockIn';
import type {
  RetailCartItem,
  RetailCheckoutInput,
  RetailOrder,
  RetailOrderItem,
  RetailPaymentMethod,
  RetailProduct,
  RetailReturn,
  RetailReturnItem
} from '../types/retail';

const RETAIL_WAREHOUSE_CODE = 'WH005';
const CASHIER_NAME = 'Cashier01';
const MANAGER_AUTH_LIMIT = 50;

const PAYMENT_LABEL: Record<RetailPaymentMethod, string> = {
  CASH: '现金',
  WECHAT: '微信',
  ALIPAY: '支付宝'
};

const DEMO_STOCK: Record<string, number> = {
  SKU001: 66,
  SKU002: 180,
  SKU003: 24,
  SKU004: 18,
  SKU006: 12
};

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

function todayCompact(): string {
  return new Date().toISOString().split('T')[0].replace(/-/g, '');
}

function roundMoney(value: number): number {
  return parseFloat(value.toFixed(2));
}

function getRetailWarehouse() {
  const warehouses = baseDataApi.getWarehouses();
  return warehouses.find(w => w.code === RETAIL_WAREHOUSE_CODE)
    || warehouses.find(w => w.type === '门店' && w.status === 'active')
    || warehouses.find(w => w.status === 'active');
}

function getLocalRetailOrders(): RetailOrder[] {
  return readTable('retailOrders', getInitialRetailOrders());
}

function saveLocalRetailOrders(orders: RetailOrder[]) {
  replaceTable('retailOrders', orders);
}

function getLocalInstantStocks(): InstantStock[] {
  return readTable('instantStocks', []);
}

function saveLocalInstantStocks(stocks: InstantStock[]) {
  replaceTable('instantStocks', stocks);
}

function getLocalInventoryFlows(): InventoryFlow[] {
  return readTable('inventoryFlows', []);
}

function saveLocalInventoryFlows(flows: InventoryFlow[]) {
  replaceTable('inventoryFlows', flows);
}

function ensureRetailStockRows(): InstantStock[] {
  const warehouse = getRetailWarehouse();
  if (!warehouse) throw new Error('没有可用门店仓库，无法进行零售收银');

  const products = baseDataApi.getProducts().filter(p => p.status === 'active');
  const stocks = getLocalInstantStocks();

  products.forEach(product => {
    const id = `${product.code}-${warehouse.code}-NONE`;
    if (!stocks.some(stock => stock.id === id)) {
      const quantity = DEMO_STOCK[product.code] ?? 20;
      stocks.push({
        id,
        productCode: product.code,
        productName: product.name,
        productSpec: product.spec,
        unit: product.unit,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        batchNo: '-',
        quantity,
        occupied: 0,
        available: quantity,
        safetyStock: 5,
        lastChangedAt: '2026-07-05 09:00:00'
      });
    }
  });

  saveLocalInstantStocks(stocks);
  return stocks;
}

function generateRetailOrderId(existing: RetailOrder[]): string {
  const prefix = `RS${todayCompact()}`;
  const next = existing.filter(order => order.id.startsWith(prefix)).length + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

function generateRetailReturnId(existing: RetailReturn[]): string {
  const prefix = `RR${todayCompact()}`;
  const next = existing.filter(item => item.id.startsWith(prefix)).length + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

function generateFlowId(existing: InventoryFlow[]): string {
  const prefix = `FL${todayCompact()}`;
  const next = existing.filter(flow => flow.id.startsWith(prefix)).length + 1;
  return `${prefix}-${String(next).padStart(8, '0')}`;
}

function summarizeCart(items: RetailCartItem[], discountAmount: number, roundOffAmount: number) {
  const totalAmount = roundMoney(items.reduce((sum, item) => sum + item.quantity * item.price, 0));
  const paidAmount = roundMoney(Math.max(totalAmount - discountAmount - roundOffAmount, 0));
  return {
    itemCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount,
    paidAmount
  };
}

function toRetailItems(items: RetailCartItem[]): RetailOrderItem[] {
  return items.map((item, index) => ({
    ...item,
    id: String(index + 1),
    amount: roundMoney(item.quantity * item.price)
  }));
}

function getInitialRetailOrders(): RetailOrder[] {
  const records: Array<{
    id: string;
    cashierName: string;
    paymentMethod: RetailPaymentMethod;
    checkoutAt: string;
    discountAmount: number;
    roundOffAmount: number;
    items: RetailCartItem[];
  }> = [
    {
      id: 'RS20260705-0010',
      cashierName: 'Cashier01',
      paymentMethod: 'WECHAT',
      checkoutAt: '2026-07-05 19:10:12',
      discountAmount: 8,
      roundOffAmount: 0.5,
      items: [
        cartSeed('SKU003', '强盛定制纯木浆A4复印纸', '6903456789012', '80g 500张/包', '包', 2, 28),
        cartSeed('SKU002', '晨光按动式中性笔黑色', '6902345678901', '0.5mm', '支', 8, 3.5)
      ]
    },
    {
      id: 'RS20260705-0009',
      cashierName: 'Cashier02',
      paymentMethod: 'ALIPAY',
      checkoutAt: '2026-07-05 18:42:33',
      discountAmount: 0,
      roundOffAmount: 0,
      items: [cartSeed('SKU006', '金士顿64GB高速U盘', '6906789012346', 'USB 3.2 金属机身', '个', 1, 79)]
    },
    {
      id: 'RS20260705-0008',
      cashierName: 'Cashier01',
      paymentMethod: 'CASH',
      checkoutAt: '2026-07-05 17:28:09',
      discountAmount: 5,
      roundOffAmount: 0,
      items: [
        cartSeed('SKU001', '双鸭牌标准型回形针', '6901234567890', '100枚/盒', '盒', 10, 5),
        cartSeed('SKU004', '得力多功能计算器', '6904567890234', '十二位液晶大屏', '台', 1, 58)
      ]
    },
    {
      id: 'RS20260705-0007',
      cashierName: 'Cashier01',
      paymentMethod: 'WECHAT',
      checkoutAt: '2026-07-05 16:55:41',
      discountAmount: 12,
      roundOffAmount: 0,
      items: [cartSeed('SKU003', '强盛定制纯木浆A4复印纸', '6903456789012', '80g 500张/包', '包', 4, 28)]
    },
    {
      id: 'RS20260705-0006',
      cashierName: 'Cashier03',
      paymentMethod: 'ALIPAY',
      checkoutAt: '2026-07-05 15:33:20',
      discountAmount: 3,
      roundOffAmount: 0.5,
      items: [
        cartSeed('SKU002', '晨光按动式中性笔黑色', '6902345678901', '0.5mm', '支', 20, 3.5),
        cartSeed('SKU001', '双鸭牌标准型回形针', '6901234567890', '100枚/盒', '盒', 3, 5)
      ]
    },
    {
      id: 'RS20260705-0005',
      cashierName: 'Cashier02',
      paymentMethod: 'WECHAT',
      checkoutAt: '2026-07-05 14:20:05',
      discountAmount: 0,
      roundOffAmount: 0,
      items: [cartSeed('SKU004', '得力多功能计算器', '6904567890234', '十二位液晶大屏', '台', 2, 58)]
    },
    {
      id: 'RS20260705-0004',
      cashierName: 'Cashier01',
      paymentMethod: 'CASH',
      checkoutAt: '2026-07-05 13:11:49',
      discountAmount: 2,
      roundOffAmount: 0,
      items: [cartSeed('SKU001', '双鸭牌标准型回形针', '6901234567890', '100枚/盒', '盒', 6, 5)]
    },
    {
      id: 'RS20260705-0003',
      cashierName: 'Cashier03',
      paymentMethod: 'WECHAT',
      checkoutAt: '2026-07-05 11:36:18',
      discountAmount: 15,
      roundOffAmount: 0,
      items: [
        cartSeed('SKU006', '金士顿64GB高速U盘', '6906789012346', 'USB 3.2 金属机身', '个', 2, 79),
        cartSeed('SKU002', '晨光按动式中性笔黑色', '6902345678901', '0.5mm', '支', 10, 3.5)
      ]
    },
    {
      id: 'RS20260705-0002',
      cashierName: 'Cashier02',
      paymentMethod: 'ALIPAY',
      checkoutAt: '2026-07-05 10:08:27',
      discountAmount: 6,
      roundOffAmount: 0.5,
      items: [cartSeed('SKU003', '强盛定制纯木浆A4复印纸', '6903456789012', '80g 500张/包', '包', 3, 28)]
    },
    {
      id: 'RS20260705-0001',
      cashierName: 'Cashier01',
      paymentMethod: 'CASH',
      checkoutAt: '2026-07-05 09:22:11',
      discountAmount: 0,
      roundOffAmount: 0,
      items: [
        cartSeed('SKU002', '晨光按动式中性笔黑色', '6902345678901', '0.5mm', '支', 12, 3.5),
        cartSeed('SKU001', '双鸭牌标准型回形针', '6901234567890', '100枚/盒', '盒', 4, 5)
      ]
    }
  ];

  return records.map(record => {
    const totals = summarizeCart(record.items, record.discountAmount, record.roundOffAmount);
    return {
      id: record.id,
      cashierName: record.cashierName,
      warehouseCode: RETAIL_WAREHOUSE_CODE,
      warehouseName: '深圳直营门店',
      status: 'CONFIRMED',
      paymentMethod: record.paymentMethod,
      itemCount: totals.itemCount,
      totalQuantity: totals.totalQuantity,
      totalAmount: totals.totalAmount,
      discountAmount: record.discountAmount,
      roundOffAmount: record.roundOffAmount,
      paidAmount: totals.paidAmount,
      checkoutAt: record.checkoutAt,
      receiptPrinted: true,
      items: toRetailItems(record.items)
    };
  });
}

function getInitialRetailReturns(): RetailReturn[] {
  return [
    makeRetailReturn('RR20260705-0001', 'RS20260705-0010', '2026-07-05', [{ itemId: '1', qty: 1 }], 'Cashier01', '2026-07-05 19:35:00'),
    makeRetailReturn('RR20260705-0002', 'RS20260705-0009', '2026-07-05', [{ itemId: '1', qty: 1 }], 'Cashier02', '2026-07-05 19:00:00'),
    makeRetailReturn('RR20260705-0003', 'RS20260705-0008', '2026-07-05', [{ itemId: '2', qty: 1 }], 'Cashier01', '2026-07-05 18:00:00'),
    makeRetailReturn('RR20260705-0004', 'RS20260705-0006', '2026-07-05', [{ itemId: '1', qty: 5 }], 'Cashier03', '2026-07-05 16:20:00'),
    makeRetailReturn('RR20260705-0005', 'RS20260705-0003', '2026-07-05', [{ itemId: '2', qty: 2 }], 'Cashier03', '2026-07-05 12:10:00')
  ];
}

function makeRetailReturn(
  id: string,
  sourceRetailOrderId: string,
  returnDate: string,
  quantities: Array<{ itemId: string; qty: number }>,
  operator: string,
  createdAt: string
): RetailReturn {
  const order = getInitialRetailOrders().find(item => item.id === sourceRetailOrderId) || readTable<RetailOrder>('retailOrders', []).find(item => item.id === sourceRetailOrderId);
  if (!order) throw new Error('初始化零售退货来源零售单缺失');
  const items: RetailReturnItem[] = quantities.map(q => {
    const source = order.items.find(item => item.id === q.itemId);
    if (!source) throw new Error('初始化零售退货明细缺失');
    return {
      id: source.id,
      productCode: source.productCode,
      productName: source.productName,
      productBarcode: source.productBarcode,
      productSpec: source.productSpec,
      unit: source.unit,
      purchaseQuantity: source.quantity,
      returnQuantity: q.qty,
      price: source.price,
      amount: roundMoney(q.qty * source.price)
    };
  });
  return {
    id,
    sourceRetailOrderId: order.id,
    cashierName: order.cashierName,
    warehouseCode: order.warehouseCode,
    warehouseName: order.warehouseName,
    paymentMethod: order.paymentMethod,
    returnDate,
    itemCount: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.returnQuantity, 0),
    refundAmount: roundMoney(items.reduce((sum, item) => sum + item.amount, 0)),
    operator,
    createdAt,
    confirmedAt: createdAt,
    items
  };
}

function getLocalRetailReturns(): RetailReturn[] {
  return readTable('retailReturns', getInitialRetailReturns());
}

function saveLocalRetailReturns(returns: RetailReturn[]) {
  replaceTable('retailReturns', returns);
}

function cartSeed(
  productCode: string,
  productName: string,
  productBarcode: string,
  productSpec: string,
  unit: string,
  quantity: number,
  price: number
): RetailCartItem {
  return { productCode, productName, productBarcode, productSpec, unit, quantity, price };
}

export const retailApi = {
  getPaymentLabel(method: RetailPaymentMethod): string {
    return PAYMENT_LABEL[method];
  },

  getRetailProducts(keyword = ''): RetailProduct[] {
    const warehouse = getRetailWarehouse();
    if (!warehouse) return [];
    const stocks = ensureRetailStockRows();
    const normalized = keyword.trim().toLowerCase();

    return baseDataApi.getProducts()
      .filter(product => product.status === 'active')
      .map(product => {
        const stock = stocks.find(row => row.warehouseCode === warehouse.code && row.productCode === product.code && row.batchNo === '-');
        return {
          code: product.code,
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          spec: product.spec,
          unit: product.unit,
          price: product.defaultRetailPrice,
          warehouseCode: warehouse.code,
          warehouseName: warehouse.name,
          stockQuantity: stock?.quantity ?? 0,
          availableQuantity: stock?.available ?? 0
        };
      })
      .filter(product => {
        if (!normalized) return true;
        return product.code.toLowerCase().includes(normalized)
          || product.name.toLowerCase().includes(normalized)
          || product.barcode.toLowerCase().includes(normalized);
      });
  },

  getRetailOrders(): RetailOrder[] {
    return getLocalRetailOrders().sort((a, b) => b.checkoutAt.localeCompare(a.checkoutAt));
  },

  getRetailOrderById(id: string): RetailOrder | null {
    return getLocalRetailOrders().find(order => order.id === id) || null;
  },

  getRetailReturns(): RetailReturn[] {
    return getLocalRetailReturns().sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
  },

  getRetailReturnById(id: string): RetailReturn | null {
    return getLocalRetailReturns().find(item => item.id === id) || null;
  },

  createRetailReturnFromRS(rsId: string): RetailReturn {
    const order = this.getRetailOrderById(rsId);
    if (!order) throw new Error('来源零售单不存在');
    const items: RetailReturnItem[] = order.items.map(item => ({
      id: item.id,
      productCode: item.productCode,
      productName: item.productName,
      productBarcode: item.productBarcode,
      productSpec: item.productSpec,
      unit: item.unit,
      purchaseQuantity: item.quantity,
      returnQuantity: item.quantity,
      price: item.price,
      amount: roundMoney(item.quantity * item.price)
    }));
    const returns = getLocalRetailReturns();
    return {
      id: generateRetailReturnId(returns),
      sourceRetailOrderId: order.id,
      cashierName: order.cashierName,
      warehouseCode: order.warehouseCode,
      warehouseName: order.warehouseName,
      paymentMethod: order.paymentMethod,
      returnDate: new Date().toISOString().split('T')[0],
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.returnQuantity, 0),
      refundAmount: roundMoney(items.reduce((sum, item) => sum + item.amount, 0)),
      operator: CASHIER_NAME,
      createdAt: getCurrentDateTime(),
      confirmedAt: getCurrentDateTime(),
      items
    };
  },

  confirmRetailReturn(data: RetailReturn): RetailReturn {
    const order = this.getRetailOrderById(data.sourceRetailOrderId);
    if (!order) throw new Error('来源零售单不存在');
    if (!data.returnDate || new Date(data.returnDate) > new Date()) throw new Error('退货日期不能为空且不能晚于今天');

    data.items.forEach(item => {
      const source = order.items.find(row => row.id === item.id);
      if (!source) throw new Error(`商品 ${item.productName} 不存在于原零售单`);
      if (item.returnQuantity <= 0) throw new Error(`商品 ${item.productName} 退货数量必须大于 0`);
      if (item.returnQuantity > source.quantity) throw new Error(`商品 ${item.productName} 退货数量不能大于原购买数 ${source.quantity}`);
    });

    const stocks = ensureRetailStockRows();
    const flows = getLocalInventoryFlows();
    const now = getCurrentDateTime();
    const items = data.items.map(item => ({
      ...item,
      amount: roundMoney(item.returnQuantity * item.price)
    }));

    items.forEach(item => {
      const stock = stocks.find(row => row.warehouseCode === data.warehouseCode && row.productCode === item.productCode && row.batchNo === '-');
      if (!stock) throw new Error(`商品 ${item.productName} 缺少门店库存行`);
      stock.quantity = roundMoney(stock.quantity + item.returnQuantity);
      stock.available = roundMoney(stock.quantity - stock.occupied);
      stock.lastChangedAt = now;
      flows.unshift({
        id: generateFlowId(flows),
        createdAt: now,
        warehouseCode: data.warehouseCode,
        warehouseName: data.warehouseName,
        productCode: item.productCode,
        productName: item.productName,
        productSpec: item.productSpec,
        unit: item.unit,
        changeType: 'SR',
        quantity: item.returnQuantity,
        postQuantity: stock.quantity,
        sourceId: data.id,
        operator: data.operator || CASHIER_NAME,
        batchNo: '-'
      });
    });

    const confirmed: RetailReturn = {
      ...data,
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.returnQuantity, 0),
      refundAmount: roundMoney(items.reduce((sum, item) => sum + item.amount, 0)),
      operator: data.operator || CASHIER_NAME,
      createdAt: now,
      confirmedAt: now
    };
    const returns = getLocalRetailReturns();
    if (returns.some(item => item.id === confirmed.id)) throw new Error('零售退货单号已存在');
    returns.unshift(confirmed);
    saveLocalRetailReturns(returns);
    saveLocalInstantStocks(stocks);
    saveLocalInventoryFlows(flows);
    return confirmed;
  },

  checkout(input: RetailCheckoutInput): RetailOrder {
    if (input.items.length === 0) throw new Error('购物车为空，无法结账');
    if (!input.paymentMethod) throw new Error('请选择收款方式');
    if (input.discountAmount > MANAGER_AUTH_LIMIT) throw new Error('需店长授权');
    if (input.discountAmount < 0 || input.roundOffAmount < 0) throw new Error('折让金额和抹零不能为负数');

    const warehouse = getRetailWarehouse();
    if (!warehouse) throw new Error('没有可用门店仓库，无法结账');

    const orders = getLocalRetailOrders();
    const stocks = ensureRetailStockRows();
    const now = getCurrentDateTime();

    input.items.forEach(item => {
      if (item.quantity <= 0) throw new Error(`${item.productName} 的数量必须大于 0`);
      const stock = stocks.find(row => row.warehouseCode === warehouse.code && row.productCode === item.productCode && row.batchNo === '-');
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`${item.productName} 门店现存不足，无法结账`);
      }
    });

    const totals = summarizeCart(input.items, input.discountAmount, input.roundOffAmount);
    const order: RetailOrder = {
      id: generateRetailOrderId(orders),
      cashierName: input.cashierName || CASHIER_NAME,
      warehouseCode: warehouse.code,
      warehouseName: warehouse.name,
      status: 'CONFIRMED',
      paymentMethod: input.paymentMethod,
      itemCount: totals.itemCount,
      totalQuantity: totals.totalQuantity,
      totalAmount: totals.totalAmount,
      discountAmount: roundMoney(input.discountAmount),
      roundOffAmount: roundMoney(input.roundOffAmount),
      paidAmount: totals.paidAmount,
      checkoutAt: now,
      receiptPrinted: true,
      items: toRetailItems(input.items)
    };

    const flows = getLocalInventoryFlows();
    order.items.forEach(item => {
      const stock = stocks.find(row => row.warehouseCode === warehouse.code && row.productCode === item.productCode && row.batchNo === '-');
      if (!stock) return;

      stock.quantity = roundMoney(stock.quantity - item.quantity);
      stock.available = Math.max(roundMoney(stock.quantity - stock.occupied), 0);
      stock.lastChangedAt = now;

      flows.unshift({
        id: generateFlowId(flows),
        createdAt: now,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        productCode: item.productCode,
        productName: item.productName,
        productSpec: item.productSpec,
        unit: item.unit,
        changeType: 'RS',
        quantity: -item.quantity,
        postQuantity: stock.quantity,
        sourceId: order.id,
        operator: order.cashierName,
        batchNo: '-'
      });
    });

    const receivables = readTable<AccountReceivable>('accountsReceivable', []);
    receivables.unshift({
      id: `RC${todayCompact()}-${String(receivables.length + 1).padStart(4, '0')}`,
      retailOrderId: order.id,
      customerName: '零售散客',
      amount: order.paidAmount,
      status: 'SETTLED',
      createdAt: now
    });

    orders.unshift(order);
    saveLocalRetailOrders(orders);
    saveLocalInstantStocks(stocks);
    saveLocalInventoryFlows(flows);
    replaceTable('accountsReceivable', receivables);

    return order;
  }
};
