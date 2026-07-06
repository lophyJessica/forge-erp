import { baseDataApi } from './baseData';
import { stockInApi } from './stockIn';
import { readTable, replaceTable, type AccountReceivable } from '../db';
import type { BaseCustomer, BaseProduct, BaseWarehouse } from '../types/baseData';
import type { InventoryFlow, InstantStock } from '../types/stockIn';
import type {
  SalesOrder,
  SalesOrderItem,
  SalesOrderStatus,
  SalesOutbound,
  SalesOutboundItem,
  SalesOutboundStatus,
  SalesReturn,
  SalesReturnItem,
  SalesReturnStatus
} from '../types/sales';

export type SalesProduct = BaseProduct & {
  wholesalePrice1: number;
  wholesalePrice2: number;
  wholesalePrice3: number;
};

export const SALES_WAREHOUSE_DEFAULT = 'WH001';

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

function getSalesProducts(): SalesProduct[] {
  return baseDataApi.getProducts().map(p => ({
    ...p,
    wholesalePrice1: roundMoney(p.defaultRetailPrice * 0.72),
    wholesalePrice2: roundMoney(p.defaultRetailPrice * 0.82),
    wholesalePrice3: roundMoney(p.defaultRetailPrice * 0.9)
  }));
}

export function getWholesalePrice(product: SalesProduct | BaseProduct, level: BaseCustomer['priceLevel']): number {
  const retail = product.defaultRetailPrice;
  if ('wholesalePrice1' in product) {
    if (level === '一级') return product.wholesalePrice1;
    if (level === '二级') return product.wholesalePrice2;
    return product.wholesalePrice3;
  }
  if (level === '一级') return roundMoney(retail * 0.72);
  if (level === '二级') return roundMoney(retail * 0.82);
  return roundMoney(retail * 0.9);
}

function getDefaultWarehouse(): BaseWarehouse {
  const active = baseDataApi.getWarehouses().find(w => w.code === SALES_WAREHOUSE_DEFAULT && w.status === 'active')
    || baseDataApi.getWarehouses().find(w => w.status === 'active');
  if (!active) throw new Error('没有可用仓库档案');
  return active;
}

function generateId(prefix: 'SO' | 'SOO' | 'SR', existingIds: string[]): string {
  const head = `${prefix}${todayCompact()}`;
  const next = existingIds.filter(id => id.startsWith(head)).length + 1;
  return `${head}-${String(next).padStart(4, '0')}`;
}

function summarizeItems(items: Array<{ quantity?: number; outboundQuantity?: number; amount: number }>) {
  const totalQuantity = items.reduce((sum, it) => sum + (it.outboundQuantity ?? it.quantity ?? 0), 0);
  return {
    itemCount: items.length,
    totalQuantity,
    totalAmount: roundMoney(items.reduce((sum, it) => sum + it.amount, 0))
  };
}

function summarizeReturnItems(items: Array<{ returnQuantity: number; amount: number }>) {
  return {
    itemCount: items.length,
    totalQuantity: items.reduce((sum, it) => sum + it.returnQuantity, 0),
    totalAmount: roundMoney(items.reduce((sum, it) => sum + it.amount, 0))
  };
}

function orderItem(
  id: string,
  productCode: string,
  quantity: number,
  level: BaseCustomer['priceLevel'],
  outboundQuantity = 0,
  remark = ''
): SalesOrderItem {
  const product = getSalesProducts().find(p => p.code === productCode);
  if (!product) throw new Error(`商品 ${productCode} 不存在`);
  const price = getWholesalePrice(product, level);
  return {
    id,
    productCode: product.code,
    productName: product.name,
    productBarcode: product.barcode,
    productSpec: product.spec,
    unit: product.unit,
    quantity,
    price,
    priceLevel: level,
    amount: roundMoney(quantity * price),
    outboundQuantity,
    pendingOutboundQuantity: Math.max(0, quantity - outboundQuantity),
    remark
  };
}

function initialOrders(): SalesOrder[] {
  return [
    makeOrder('SO20260618-0001', 'CUST001', 'WH001', '2026-06-18', 'COMPLETED', [
      orderItem('1', 'SKU001', 20, '一级', 20, '端午节前补货')
    ], '北京加盟店办公文具补货', 'Sales01', '2026-06-18 09:30:00', 'Admin', '2026-06-18 10:00:00'),
    makeOrder('SO20260625-0001', 'CUST004', 'WH001', '2026-06-25', 'PARTIAL_OUTBOUND', [
      orderItem('1', 'SKU003', 30, '一级', 12, '客户分批提货')
    ], '深圳代理商复印纸订单', 'Sales02', '2026-06-25 11:20:00', 'Admin', '2026-06-25 14:00:00'),
    makeOrder('SO20260701-0001', 'CUST002', 'WH002', '2026-07-01', 'APPROVED', [
      orderItem('1', 'SKU006', 5, '二级', 0, '连锁门店会员礼品')
    ], '上海连锁便利店数码礼品', 'Sales01', '2026-07-01 10:15:00', 'Admin', '2026-07-01 10:30:00'),
    makeOrder('SO20260702-0001', 'CUST003', 'WH003', '2026-07-02', 'PENDING_AUDIT', [
      orderItem('1', 'SKU002', 20, '三级', 0, '学校开学补货')
    ], '大学城书店文具补货', 'Sales03', '2026-07-02 15:40:00'),
    makeOrder('SO20260703-0001', 'CUST001', 'WH001', '2026-07-03', 'DRAFT', [
      orderItem('1', 'SKU004', 2, '一级', 0, '客户临时询价')
    ], '草稿待确认', 'Sales01', '2026-07-03 09:10:00'),
    makeOrder('SO20260703-0002', 'CUST005', 'WH001', '2026-07-03', 'VOIDED', [
      orderItem('1', 'SKU001', 12, '三级', 0, '停用客户误建')
    ], '客户档案停用，单据作废', 'Sales02', '2026-07-03 10:00:00'),
    makeOrder('SO20260704-0001', 'CUST001', 'WH001', '2026-07-04', 'APPROVED', [
      orderItem('1', 'SKU001', 10, '一级', 0, '已锁定可用库存')
    ], '北京加盟店回形针补货', 'Sales01', '2026-07-04 08:45:00', 'Admin', '2026-07-04 09:00:00'),
    makeOrder('SO20260704-0002', 'CUST003', 'WH003', '2026-07-04', 'PARTIAL_OUTBOUND', [
      orderItem('1', 'SKU002', 30, '三级', 20, '剩余数量等下一车')
    ], '书店中性笔分批出库', 'Sales03', '2026-07-04 13:00:00', 'Admin', '2026-07-04 13:15:00')
  ];
}

function makeOrder(
  id: string,
  customerCode: string,
  warehouseCode: string,
  orderDate: string,
  status: SalesOrderStatus,
  items: SalesOrderItem[],
  remark: string,
  createdBy: string,
  createdAt: string,
  approvedBy?: string,
  approvedAt?: string
): SalesOrder {
  const customer = baseDataApi.getCustomerByCode(customerCode);
  const warehouse = baseDataApi.getWarehouseByCode(warehouseCode);
  if (!customer || !warehouse) throw new Error('初始化销售订单基础资料缺失');
  const totals = summarizeItems(items);
  return {
    id,
    customerCode,
    customerName: customer.name,
    customerPriceLevel: customer.priceLevel,
    warehouseCode,
    warehouseName: warehouse.name,
    orderDate,
    status,
    remark,
    ...totals,
    createdBy,
    createdAt,
    updatedBy: createdBy,
    updatedAt: createdAt,
    approvedBy,
    approvedAt,
    voidReason: status === 'VOIDED' ? '客户档案不可用，销售单作废' : undefined,
    items
  };
}

function initialOutbounds(): SalesOutbound[] {
  return [
    makeOutbound('SOO20260618-0001', 'SO20260618-0001', '2026-06-18', 'CONFIRMED', [{ itemId: '1', qty: 20 }], '全量出库', '2026-06-18 10:20:00'),
    makeOutbound('SOO20260625-0001', 'SO20260625-0001', '2026-06-26', 'CONFIRMED', [{ itemId: '1', qty: 12 }], '第一批出库', '2026-06-26 09:20:00'),
    makeOutbound('SOO20260701-0001', 'SO20260701-0001', '2026-07-02', 'DRAFT', [{ itemId: '1', qty: 5 }], '仓库拣货中', '2026-07-02 10:00:00'),
    makeOutbound('SOO20260701-0002', 'SO20260701-0001', '2026-07-02', 'VOIDED', [{ itemId: '1', qty: 5 }], '制单仓库备注错误，已作废', '2026-07-02 09:30:00'),
    makeOutbound('SOO20260704-0001', 'SO20260704-0002', '2026-07-04', 'CONFIRMED', [{ itemId: '1', qty: 20 }], '第一车已发货', '2026-07-04 15:00:00'),
    makeOutbound('SOO20260704-0002', 'SO20260625-0001', '2026-07-04', 'DRAFT', [{ itemId: '1', qty: 18 }], '剩余纸张等待装车', '2026-07-04 16:00:00'),
    makeOutbound('SOO20260704-0003', 'SO20260704-0001', '2026-07-04', 'DRAFT', [{ itemId: '1', qty: 10 }], '准备出库复核', '2026-07-04 16:30:00'),
    makeOutbound('SOO20260704-0004', 'SO20260618-0001', '2026-07-04', 'VOIDED', [{ itemId: '1', qty: 0 }], '测试草稿作废记录', '2026-07-04 17:00:00')
  ];
}

function initialSalesReturns(): SalesReturn[] {
  return [
    makeSalesReturn('SR20260619-0001', 'SOO20260618-0001', '2026-06-19', 'CONFIRMED', [{ itemId: '1', qty: 2 }], '客户门店清点发现多订，包装完好退回', '2026-06-19 10:10:00'),
    makeSalesReturn('SR20260627-0001', 'SOO20260625-0001', '2026-06-27', 'CONFIRMED', [{ itemId: '1', qty: 3 }], '复印纸外箱轻微受潮，客户申请退回部分', '2026-06-27 15:20:00'),
    makeSalesReturn('SR20260704-0001', 'SOO20260704-0001', '2026-07-04', 'CONFIRMED', [{ itemId: '1', qty: 5 }], '客户收货后发现部分笔芯颜色不一致', '2026-07-04 18:00:00'),
    makeSalesReturn('SR20260704-0002', 'SOO20260618-0001', '2026-07-04', 'DRAFT', [{ itemId: '1', qty: 1 }], '客户补充退货申请，待仓库复核', '2026-07-04 18:20:00'),
    makeSalesReturn('SR20260704-0003', 'SOO20260625-0001', '2026-07-04', 'VOIDED', [{ itemId: '1', qty: 1 }], '重复录入作废', '2026-07-04 18:35:00'),
    makeSalesReturn('SR20260705-0001', 'SOO20260704-0001', '2026-07-05', 'DRAFT', [{ itemId: '1', qty: 2 }], '客户申请二次退回，原因待补充', '2026-07-05 09:30:00'),
    makeSalesReturn('SR20260705-0002', 'SOO20260618-0001', '2026-07-05', 'CONFIRMED', [{ itemId: '1', qty: 1 }], '客户现场退回多余备货', '2026-07-05 11:00:00'),
    makeSalesReturn('SR20260705-0003', 'SOO20260625-0001', '2026-07-05', 'CONFIRMED', [{ itemId: '1', qty: 2 }], '客户退回挤压变形纸包', '2026-07-05 14:20:00')
  ];
}

function makeSalesReturn(
  id: string,
  sourceOutboundId: string,
  returnDate: string,
  status: SalesReturnStatus,
  quantities: Array<{ itemId: string; qty: number }>,
  returnReason: string,
  createdAt: string
): SalesReturn {
  const outbound = initialOutbounds().find(o => o.id === sourceOutboundId) || readTable<SalesOutbound>('salesOutbounds', []).find(o => o.id === sourceOutboundId);
  if (!outbound) throw new Error('初始化销售退货单来源 SOO 缺失');
  const items: SalesReturnItem[] = quantities.map(q => {
    const source = outbound.items.find(it => it.id === q.itemId);
    if (!source) throw new Error('初始化销售退货单明细缺失');
    return {
      id: source.id,
      productCode: source.productCode,
      productName: source.productName,
      productBarcode: source.productBarcode,
      productSpec: source.productSpec,
      unit: source.unit,
      outboundQuantity: source.outboundQuantity,
      returnQuantity: q.qty,
      price: source.price,
      amount: roundMoney(q.qty * source.price),
      remark: ''
    };
  });
  const totals = summarizeReturnItems(items);
  return {
    id,
    sourceOutboundId: outbound.id,
    sourceSalesOrderId: outbound.salesOrderId,
    customerCode: outbound.customerCode,
    customerName: outbound.customerName,
    warehouseCode: outbound.warehouseCode,
    warehouseName: outbound.warehouseName,
    returnDate,
    returnReason,
    status,
    ...totals,
    createdBy: 'Sales01',
    createdAt,
    updatedBy: 'Sales01',
    updatedAt: createdAt,
    confirmedBy: status === 'CONFIRMED' ? 'Storekeeper01' : undefined,
    confirmedAt: status === 'CONFIRMED' ? createdAt : undefined,
    voidReason: status === 'VOIDED' ? '重复录入作废' : undefined,
    items
  };
}

function makeOutbound(
  id: string,
  salesOrderId: string,
  outboundDate: string,
  status: SalesOutboundStatus,
  quantities: Array<{ itemId: string; qty: number }>,
  remark: string,
  createdAt: string
): SalesOutbound {
  const order = initialOrders().find(o => o.id === salesOrderId) || readTable<SalesOrder>('salesOrders', []).find(o => o.id === salesOrderId);
  if (!order) throw new Error('初始化销售出库单来源销售订单缺失');
  const items: SalesOutboundItem[] = quantities.map(q => {
    const source = order.items.find(it => it.id === q.itemId);
    if (!source) throw new Error('初始化销售出库单明细缺失');
    return {
      id: source.id,
      productCode: source.productCode,
      productName: source.productName,
      productBarcode: source.productBarcode,
      productSpec: source.productSpec,
      unit: source.unit,
      orderQuantity: source.quantity,
      orderPendingQuantity: source.pendingOutboundQuantity,
      outboundQuantity: q.qty,
      price: source.price,
      amount: roundMoney(q.qty * source.price),
      remark: ''
    };
  });
  const totals = summarizeItems(items);
  return {
    id,
    salesOrderId,
    customerCode: order.customerCode,
    customerName: order.customerName,
    warehouseCode: order.warehouseCode,
    warehouseName: order.warehouseName,
    outboundDate,
    status,
    salesRemark: order.remark,
    remark,
    ...totals,
    createdBy: 'Storekeeper01',
    createdAt,
    updatedBy: 'Storekeeper01',
    updatedAt: createdAt,
    confirmedBy: status === 'CONFIRMED' ? 'Storekeeper01' : undefined,
    confirmedAt: status === 'CONFIRMED' ? createdAt : undefined,
    items
  };
}

function getLocalOrders(): SalesOrder[] {
  return readTable('salesOrders', initialOrders());
}

function saveLocalOrders(orders: SalesOrder[]) {
  replaceTable('salesOrders', orders);
}

function getLocalOutbounds(): SalesOutbound[] {
  return readTable('salesOutbounds', initialOutbounds());
}

function saveLocalOutbounds(outbounds: SalesOutbound[]) {
  replaceTable('salesOutbounds', outbounds);
}

function getLocalSalesReturns(): SalesReturn[] {
  return readTable('salesReturns', initialSalesReturns());
}

function saveLocalSalesReturns(returns: SalesReturn[]) {
  replaceTable('salesReturns', returns);
}

function getLocalInstantStocks(): InstantStock[] {
  stockInApi.getInstantStocks();
  return readTable('instantStocks', []);
}

function saveLocalInstantStocks(stocks: InstantStock[]) {
  replaceTable('instantStocks', stocks);
}

function getLocalInventoryFlows(): InventoryFlow[] {
  stockInApi.getGlobalInventoryFlows();
  return readTable('inventoryFlows', []);
}

function ensureStockRow(stocks: InstantStock[], order: SalesOrder, item: SalesOrderItem): InstantStock {
  const id = `${item.productCode}-${order.warehouseCode}-NONE`;
  let stock = stocks.find(s => s.id === id);
  if (!stock) {
    stock = {
      id,
      productCode: item.productCode,
      productName: item.productName,
      productSpec: item.productSpec,
      unit: item.unit,
      warehouseCode: order.warehouseCode,
      warehouseName: order.warehouseName,
      batchNo: '-',
      quantity: 0,
      occupied: 0,
      available: 0,
      safetyStock: '-',
      lastChangedAt: getCurrentDateTime()
    };
    stocks.push(stock);
  }
  return stock;
}

function occupyStock(order: SalesOrder) {
  const stocks = getLocalInstantStocks();
  for (const item of order.items) {
    const stock = ensureStockRow(stocks, order, item);
    if (stock.available < item.pendingOutboundQuantity) {
      throw new Error(`商品 ${item.productName} 可用库存不足：可用 ${stock.available}，需占用 ${item.pendingOutboundQuantity}`);
    }
  }
  for (const item of order.items) {
    const stock = ensureStockRow(stocks, order, item);
    stock.occupied += item.pendingOutboundQuantity;
    stock.available = stock.quantity - stock.occupied;
    stock.lastChangedAt = getCurrentDateTime();
  }
  saveLocalInstantStocks(stocks);
}

function releaseStock(order: SalesOrder) {
  const stocks = getLocalInstantStocks();
  order.items.forEach(item => {
    const stock = ensureStockRow(stocks, order, item);
    stock.occupied = Math.max(0, stock.occupied - item.pendingOutboundQuantity);
    stock.available = stock.quantity - stock.occupied;
    stock.lastChangedAt = getCurrentDateTime();
  });
  saveLocalInstantStocks(stocks);
}

function applyOutboundInventory(order: SalesOrder, outbound: SalesOutbound) {
  const stocks = getLocalInstantStocks();
  const flows = getLocalInventoryFlows();

  for (const item of outbound.items) {
    if (item.outboundQuantity <= 0) throw new Error(`商品 ${item.productName} 实出数量必须大于 0`);
    if (item.outboundQuantity > item.orderPendingQuantity) {
      throw new Error(`商品 ${item.productName} 实出数量不能超过应出数量 ${item.orderPendingQuantity}`);
    }
    const stock = ensureStockRow(stocks, order, {
      ...item,
      quantity: item.orderQuantity,
      priceLevel: order.customerPriceLevel,
      outboundQuantity: 0,
      pendingOutboundQuantity: item.orderPendingQuantity
    });
    if (stock.quantity < item.outboundQuantity) {
      throw new Error(`商品 ${item.productName} 现存库存不足：现存 ${stock.quantity}，需出库 ${item.outboundQuantity}`);
    }
    if (stock.occupied < item.outboundQuantity) {
      throw new Error(`商品 ${item.productName} 占用库存不足：占用 ${stock.occupied}，需释放 ${item.outboundQuantity}`);
    }
  }

  for (const item of outbound.items) {
    const stock = ensureStockRow(stocks, order, {
      ...item,
      quantity: item.orderQuantity,
      priceLevel: order.customerPriceLevel,
      outboundQuantity: 0,
      pendingOutboundQuantity: item.orderPendingQuantity
    });
    stock.quantity -= item.outboundQuantity;
    stock.occupied = Math.max(0, stock.occupied - item.outboundQuantity);
    stock.available = stock.quantity - stock.occupied;
    stock.lastChangedAt = getCurrentDateTime();

    const flowId = `FL${todayCompact()}-${String(flows.length + 1).padStart(8, '0')}`;
    flows.unshift({
      id: flowId,
      createdAt: getCurrentDateTime(),
      warehouseCode: outbound.warehouseCode,
      warehouseName: outbound.warehouseName,
      productCode: item.productCode,
      productName: item.productName,
      productSpec: item.productSpec,
      unit: item.unit,
      changeType: 'SOO',
      quantity: -item.outboundQuantity,
      postQuantity: stock.quantity,
      sourceId: outbound.id,
      operator: outbound.confirmedBy || 'Storekeeper01',
      batchNo: '-'
    });
  }

  saveLocalInstantStocks(stocks);
  replaceTable('inventoryFlows', flows);
}

function refreshOrderTotals(order: SalesOrder): SalesOrder {
  const totals = summarizeItems(order.items);
  return { ...order, ...totals };
}

function applySalesReturnInventory(sr: SalesReturn) {
  const stocks = getLocalInstantStocks();
  const flows = getLocalInventoryFlows();
  const now = getCurrentDateTime();

  sr.items.forEach(item => {
    const stockId = `${item.productCode}-${sr.warehouseCode}-NONE`;
    let stock = stocks.find(row => row.id === stockId);
    if (!stock) {
      stock = {
        id: stockId,
        productCode: item.productCode,
        productName: item.productName,
        productSpec: item.productSpec,
        unit: item.unit,
        warehouseCode: sr.warehouseCode,
        warehouseName: sr.warehouseName,
        batchNo: '-',
        quantity: 0,
        occupied: 0,
        available: 0,
        safetyStock: '-',
        lastChangedAt: now
      };
      stocks.push(stock);
    }
    stock.quantity = roundMoney(stock.quantity + item.returnQuantity);
    stock.available = roundMoney(stock.quantity - stock.occupied);
    stock.lastChangedAt = now;

    flows.unshift({
      id: `FL${todayCompact()}-${String(flows.length + 1).padStart(8, '0')}`,
      createdAt: now,
      warehouseCode: sr.warehouseCode,
      warehouseName: sr.warehouseName,
      productCode: item.productCode,
      productName: item.productName,
      productSpec: item.productSpec,
      unit: item.unit,
      changeType: 'SR',
      quantity: item.returnQuantity,
      postQuantity: stock.quantity,
      sourceId: sr.id,
      operator: sr.confirmedBy || 'Storekeeper01',
      batchNo: '-'
    });
  });

  saveLocalInstantStocks(stocks);
  replaceTable('inventoryFlows', flows);
}

export const salesApi = {
  getCustomers(): BaseCustomer[] {
    return baseDataApi.getCustomers().filter(c => c.status === 'active');
  },

  getProducts(): SalesProduct[] {
    return getSalesProducts().filter(p => p.status === 'active');
  },

  getWarehouses(): BaseWarehouse[] {
    return baseDataApi.getWarehouses().filter(w => w.status === 'active');
  },

  getSalesOrders(filters: {
    status?: SalesOrderStatus | 'ALL' | '';
    soNumber?: string;
    customerCode?: string;
    orderDateStart?: string;
    orderDateEnd?: string;
  } = {}): SalesOrder[] {
    let orders = getLocalOrders();
    if (filters.status && filters.status !== 'ALL') orders = orders.filter(o => o.status === filters.status);
    if (filters.soNumber) orders = orders.filter(o => o.id.toLowerCase().includes(filters.soNumber!.toLowerCase().trim()));
    if (filters.customerCode) orders = orders.filter(o => o.customerCode === filters.customerCode);
    if (filters.orderDateStart) orders = orders.filter(o => o.orderDate >= filters.orderDateStart!);
    if (filters.orderDateEnd) orders = orders.filter(o => o.orderDate <= filters.orderDateEnd!);
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getSalesOrderById(id: string): SalesOrder | null {
    return getLocalOrders().find(o => o.id === id) || null;
  },

  createSalesOrder(data: {
    customerCode: string;
    orderDate: string;
    remark?: string;
    items: Array<Omit<SalesOrderItem, 'outboundQuantity' | 'pendingOutboundQuantity'>>;
  }): SalesOrder {
    const orders = getLocalOrders();
    const customer = baseDataApi.getCustomerByCode(data.customerCode);
    if (!customer) throw new Error('客户不存在');
    const warehouse = getDefaultWarehouse();
    const items: SalesOrderItem[] = data.items.map(item => ({
      ...item,
      priceLevel: customer.priceLevel,
      amount: roundMoney(item.quantity * item.price),
      outboundQuantity: 0,
      pendingOutboundQuantity: item.quantity
    }));
    const newOrder = refreshOrderTotals({
      id: generateId('SO', orders.map(o => o.id)),
      customerCode: customer.code,
      customerName: customer.name,
      customerPriceLevel: customer.priceLevel,
      warehouseCode: warehouse.code,
      warehouseName: warehouse.name,
      orderDate: data.orderDate,
      status: 'DRAFT',
      remark: data.remark,
      itemCount: 0,
      totalQuantity: 0,
      totalAmount: 0,
      createdBy: 'Sales01',
      createdAt: getCurrentDateTime(),
      updatedBy: 'Sales01',
      updatedAt: getCurrentDateTime(),
      items
    });
    orders.unshift(newOrder);
    saveLocalOrders(orders);
    return newOrder;
  },

  updateSalesOrder(id: string, data: Partial<SalesOrder>): SalesOrder {
    const orders = getLocalOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('销售订单不存在');
    const existing = orders[idx];
    const locked = existing.status !== 'DRAFT';

    let next: SalesOrder = {
      ...existing,
      remark: data.remark,
      updatedBy: 'Sales01',
      updatedAt: getCurrentDateTime()
    };

    if (!locked) {
      const customer = data.customerCode ? baseDataApi.getCustomerByCode(data.customerCode) : null;
      const nextCustomer = customer || baseDataApi.getCustomerByCode(existing.customerCode);
      if (!nextCustomer) throw new Error('客户不存在');
      const items = (data.items || existing.items).map(item => ({
        ...item,
        priceLevel: nextCustomer.priceLevel,
        amount: roundMoney(item.quantity * item.price),
        outboundQuantity: 0,
        pendingOutboundQuantity: item.quantity
      }));
      next = refreshOrderTotals({
        ...next,
        customerCode: nextCustomer.code,
        customerName: nextCustomer.name,
        customerPriceLevel: nextCustomer.priceLevel,
        orderDate: data.orderDate || existing.orderDate,
        items
      });
    }

    orders[idx] = next;
    saveLocalOrders(orders);
    return next;
  },

  deleteSalesOrder(id: string) {
    const orders = getLocalOrders();
    const target = orders.find(o => o.id === id);
    if (!target) throw new Error('销售订单不存在');
    if (target.status !== 'DRAFT') throw new Error('只有草稿销售订单可以删除');
    saveLocalOrders(orders.filter(o => o.id !== id));
  },

  submitSalesOrder(id: string): SalesOrder {
    const orders = getLocalOrders();
    const order = orders.find(o => o.id === id);
    if (!order) throw new Error('销售订单不存在');
    if (order.status !== 'DRAFT') throw new Error('只有草稿可以提交审核');
    if (order.items.length === 0) throw new Error('商品明细不能为空');
    order.status = 'PENDING_AUDIT';
    order.updatedBy = 'Sales01';
    order.updatedAt = getCurrentDateTime();
    saveLocalOrders(orders);
    return order;
  },

  approveSalesOrder(id: string): SalesOrder {
    const orders = getLocalOrders();
    const order = orders.find(o => o.id === id);
    if (!order) throw new Error('销售订单不存在');
    if (order.status !== 'PENDING_AUDIT') throw new Error('只有待审核销售订单可以审核');
    occupyStock(order);
    order.status = 'APPROVED';
    order.approvedBy = 'Admin';
    order.approvedAt = getCurrentDateTime();
    order.updatedBy = 'Admin';
    order.updatedAt = getCurrentDateTime();
    saveLocalOrders(orders);
    return order;
  },

  rejectSalesOrder(id: string): SalesOrder {
    const orders = getLocalOrders();
    const order = orders.find(o => o.id === id);
    if (!order) throw new Error('销售订单不存在');
    if (order.status !== 'PENDING_AUDIT') throw new Error('只有待审核销售订单可以驳回');
    order.status = 'DRAFT';
    order.updatedBy = 'Admin';
    order.updatedAt = getCurrentDateTime();
    saveLocalOrders(orders);
    return order;
  },

  voidSalesOrder(id: string, reason = '用户作废'): SalesOrder {
    const orders = getLocalOrders();
    const order = orders.find(o => o.id === id);
    if (!order) throw new Error('销售订单不存在');
    if (order.status !== 'PENDING_AUDIT') throw new Error('只有待审核销售订单可以作废');
    order.status = 'VOIDED';
    order.voidReason = reason;
    order.updatedBy = 'Admin';
    order.updatedAt = getCurrentDateTime();
    saveLocalOrders(orders);
    return order;
  },

  createSalesOutboundFromSO(orderId: string): SalesOutbound {
    const orders = getLocalOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('销售订单不存在');
    if (order.status !== 'APPROVED' && order.status !== 'PARTIAL_OUTBOUND') {
      throw new Error('只有已审核或部分出库销售订单可以创建出库单');
    }
    const pendingItems = order.items.filter(it => it.pendingOutboundQuantity > 0);
    if (pendingItems.length === 0) throw new Error('该销售订单已无待出库数量');

    const outbounds = getLocalOutbounds();
    const draftExists = outbounds.some(o => o.salesOrderId === order.id && o.status === 'DRAFT');
    if (draftExists) throw new Error('该销售订单已有草稿出库单，请先处理草稿');

    const items: SalesOutboundItem[] = pendingItems.map(it => ({
      id: it.id,
      productCode: it.productCode,
      productName: it.productName,
      productBarcode: it.productBarcode,
      productSpec: it.productSpec,
      unit: it.unit,
      orderQuantity: it.quantity,
      orderPendingQuantity: it.pendingOutboundQuantity,
      outboundQuantity: it.pendingOutboundQuantity,
      price: it.price,
      amount: roundMoney(it.pendingOutboundQuantity * it.price),
      remark: ''
    }));
    const totals = summarizeItems(items);
    const outbound: SalesOutbound = {
      id: generateId('SOO', outbounds.map(o => o.id)),
      salesOrderId: order.id,
      customerCode: order.customerCode,
      customerName: order.customerName,
      warehouseCode: order.warehouseCode,
      warehouseName: order.warehouseName,
      outboundDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      salesRemark: order.remark,
      remark: '',
      ...totals,
      createdBy: 'Storekeeper01',
      createdAt: getCurrentDateTime(),
      updatedBy: 'Storekeeper01',
      updatedAt: getCurrentDateTime(),
      items
    };
    outbounds.unshift(outbound);
    saveLocalOutbounds(outbounds);
    return outbound;
  },

  getSalesOutbounds(filters: {
    status?: SalesOutboundStatus | 'ALL' | '';
    sooNumber?: string;
    soNumber?: string;
    customerCode?: string;
    warehouseCode?: string;
    outboundDateStart?: string;
    outboundDateEnd?: string;
  } = {}): SalesOutbound[] {
    let outbounds = getLocalOutbounds();
    if (filters.status && filters.status !== 'ALL') outbounds = outbounds.filter(o => o.status === filters.status);
    if (filters.sooNumber) outbounds = outbounds.filter(o => o.id.toLowerCase().includes(filters.sooNumber!.toLowerCase().trim()));
    if (filters.soNumber) outbounds = outbounds.filter(o => o.salesOrderId.toLowerCase().includes(filters.soNumber!.toLowerCase().trim()));
    if (filters.customerCode) outbounds = outbounds.filter(o => o.customerCode === filters.customerCode);
    if (filters.warehouseCode) outbounds = outbounds.filter(o => o.warehouseCode === filters.warehouseCode);
    if (filters.outboundDateStart) outbounds = outbounds.filter(o => o.outboundDate >= filters.outboundDateStart!);
    if (filters.outboundDateEnd) outbounds = outbounds.filter(o => o.outboundDate <= filters.outboundDateEnd!);
    return outbounds.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getSalesOutboundById(id: string): SalesOutbound | null {
    return getLocalOutbounds().find(o => o.id === id) || null;
  },

  getSalesReturns(filters: {
    status?: SalesReturnStatus | 'ALL' | '';
    srNumber?: string;
    sooNumber?: string;
    customerCode?: string;
    returnDateStart?: string;
    returnDateEnd?: string;
  } = {}): SalesReturn[] {
    let list = getLocalSalesReturns();
    if (filters.status && filters.status !== 'ALL') list = list.filter(item => item.status === filters.status);
    if (filters.srNumber) list = list.filter(item => item.id.toLowerCase().includes(filters.srNumber!.trim().toLowerCase()));
    if (filters.sooNumber) list = list.filter(item => item.sourceOutboundId.toLowerCase().includes(filters.sooNumber!.trim().toLowerCase()));
    if (filters.customerCode) list = list.filter(item => item.customerCode === filters.customerCode);
    if (filters.returnDateStart) list = list.filter(item => item.returnDate >= filters.returnDateStart!);
    if (filters.returnDateEnd) list = list.filter(item => item.returnDate <= filters.returnDateEnd!);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getSalesReturnById(id: string): SalesReturn | null {
    return getLocalSalesReturns().find(item => item.id === id) || null;
  },

  createSalesReturnFromSOO(sooId: string): SalesReturn {
    const outbound = this.getSalesOutboundById(sooId);
    if (!outbound) throw new Error('来源销售出库单不存在');
    if (outbound.status !== 'CONFIRMED') throw new Error('只有已确认销售出库单可以下推销售退货');

    const returns = getLocalSalesReturns();
    const draftExists = returns.some(item => item.sourceOutboundId === outbound.id && item.status === 'DRAFT');
    if (draftExists) throw new Error('该 SOO 已存在草稿销售退货单，请先处理草稿');

    const items: SalesReturnItem[] = outbound.items.map(item => ({
      id: item.id,
      productCode: item.productCode,
      productName: item.productName,
      productBarcode: item.productBarcode,
      productSpec: item.productSpec,
      unit: item.unit,
      outboundQuantity: item.outboundQuantity,
      returnQuantity: item.outboundQuantity,
      price: item.price,
      amount: roundMoney(item.outboundQuantity * item.price),
      remark: ''
    }));
    const totals = summarizeReturnItems(items);
    const sr: SalesReturn = {
      id: generateId('SR', returns.map(item => item.id)),
      sourceOutboundId: outbound.id,
      sourceSalesOrderId: outbound.salesOrderId,
      customerCode: outbound.customerCode,
      customerName: outbound.customerName,
      warehouseCode: outbound.warehouseCode,
      warehouseName: outbound.warehouseName,
      returnDate: new Date().toISOString().split('T')[0],
      returnReason: '',
      status: 'DRAFT',
      ...totals,
      createdBy: 'Sales01',
      createdAt: getCurrentDateTime(),
      updatedBy: 'Sales01',
      updatedAt: getCurrentDateTime(),
      items
    };
    returns.unshift(sr);
    saveLocalSalesReturns(returns);
    return sr;
  },

  saveSalesReturnDraft(sr: SalesReturn): SalesReturn {
    const list = getLocalSalesReturns();
    const idx = list.findIndex(item => item.id === sr.id);
    if (idx === -1) throw new Error('销售退货单不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿销售退货单可以编辑');

    sr.items.forEach(item => {
      if (item.returnQuantity > item.outboundQuantity) throw new Error(`商品 ${item.productName} 退货数量不能大于已出数量 ${item.outboundQuantity}`);
      if (item.returnQuantity < 0) throw new Error(`商品 ${item.productName} 退货数量不能为负数`);
    });

    const totals = summarizeReturnItems(sr.items.map(item => ({
      ...item,
      amount: roundMoney(item.returnQuantity * item.price)
    })));
    const next: SalesReturn = {
      ...list[idx],
      returnDate: sr.returnDate,
      returnReason: sr.returnReason,
      items: sr.items.map(item => ({
        ...item,
        amount: roundMoney(item.returnQuantity * item.price)
      })),
      ...totals,
      updatedBy: 'Sales01',
      updatedAt: getCurrentDateTime()
    };
    list[idx] = next;
    saveLocalSalesReturns(list);
    return next;
  },

  confirmSalesReturn(id: string, data?: SalesReturn): SalesReturn {
    if (data) this.saveSalesReturnDraft(data);
    const list = getLocalSalesReturns();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) throw new Error('销售退货单不存在');
    const sr = list[idx];
    if (sr.status !== 'DRAFT') throw new Error('只有草稿销售退货单可以确认');
    if (!sr.returnReason.trim()) throw new Error('退货原因必填');
    if (sr.returnReason.length > 200) throw new Error('退货原因不能超过 200 字');
    if (!sr.returnDate) throw new Error('退货日期必填');
    if (new Date(sr.returnDate) > new Date()) throw new Error('退货日期不能晚于今天');
    sr.items.forEach(item => {
      if (item.returnQuantity <= 0) throw new Error(`商品 ${item.productName} 退货数量必须大于 0`);
      if (item.returnQuantity > item.outboundQuantity) throw new Error(`商品 ${item.productName} 退货数量不能大于已出数量 ${item.outboundQuantity}`);
    });

    sr.status = 'CONFIRMED';
    sr.confirmedBy = 'Storekeeper01';
    sr.confirmedAt = getCurrentDateTime();
    sr.updatedBy = 'Storekeeper01';
    sr.updatedAt = getCurrentDateTime();
    applySalesReturnInventory(sr);

    const receivables = readTable<AccountReceivable>('accountsReceivable', []);
    receivables.unshift({
      id: `AR${todayCompact()}-${String(receivables.length + 1).padStart(4, '0')}`,
      salesOutboundId: sr.sourceOutboundId,
      sourceNo: sr.id,
      customerCode: sr.customerCode,
      customerName: sr.customerName,
      amount: -sr.totalAmount,
      status: 'RETURN_OFFSET',
      createdAt: getCurrentDateTime(),
      sourceDate: sr.returnDate
    });
    replaceTable('accountsReceivable', receivables);

    list[idx] = sr;
    saveLocalSalesReturns(list);
    return sr;
  },

  voidSalesReturn(id: string): SalesReturn {
    const list = getLocalSalesReturns();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) throw new Error('销售退货单不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿销售退货单可以作废');
    list[idx] = {
      ...list[idx],
      status: 'VOIDED',
      voidReason: '用户作废',
      updatedBy: 'Sales01',
      updatedAt: getCurrentDateTime()
    };
    saveLocalSalesReturns(list);
    return list[idx];
  },

  deleteSalesReturn(id: string) {
    const list = getLocalSalesReturns();
    const target = list.find(item => item.id === id);
    if (!target) throw new Error('销售退货单不存在');
    if (target.status !== 'DRAFT') throw new Error('只有草稿销售退货单可以删除');
    saveLocalSalesReturns(list.filter(item => item.id !== id));
  },

  saveSalesOutboundDraft(id: string, data: {
    outboundDate: string;
    remark?: string;
    items: Array<{ id: string; outboundQuantity: number; remark?: string }>;
  }): SalesOutbound {
    const outbounds = getLocalOutbounds();
    const idx = outbounds.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('销售出库单不存在');
    const outbound = outbounds[idx];
    if (outbound.status !== 'DRAFT') throw new Error('只有草稿销售出库单可以编辑');
    outbound.outboundDate = data.outboundDate;
    outbound.remark = data.remark;
    outbound.items = outbound.items.map(item => {
      const next = data.items.find(x => x.id === item.id);
      if (!next) return item;
      return {
        ...item,
        outboundQuantity: next.outboundQuantity,
        amount: roundMoney(next.outboundQuantity * item.price),
        remark: next.remark
      };
    });
    const totals = summarizeItems(outbound.items);
    outbound.itemCount = totals.itemCount;
    outbound.totalQuantity = totals.totalQuantity;
    outbound.totalAmount = totals.totalAmount;
    outbound.updatedBy = 'Storekeeper01';
    outbound.updatedAt = getCurrentDateTime();
    outbounds[idx] = outbound;
    saveLocalOutbounds(outbounds);
    return outbound;
  },

  confirmSalesOutbound(id: string, data?: {
    outboundDate: string;
    remark?: string;
    items: Array<{ id: string; outboundQuantity: number; remark?: string }>;
  }): SalesOutbound {
    if (data) this.saveSalesOutboundDraft(id, data);
    const outbounds = getLocalOutbounds();
    const idx = outbounds.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('销售出库单不存在');
    const outbound = outbounds[idx];
    if (outbound.status !== 'DRAFT') throw new Error('只有草稿销售出库单可以确认出库');

    const orders = getLocalOrders();
    const orderIdx = orders.findIndex(o => o.id === outbound.salesOrderId);
    if (orderIdx === -1) throw new Error('来源销售订单不存在');
    const order = orders[orderIdx];
    if (order.status !== 'APPROVED' && order.status !== 'PARTIAL_OUTBOUND') {
      throw new Error('来源销售订单当前状态不允许出库');
    }
    if (!outbound.outboundDate || new Date(outbound.outboundDate) > new Date()) {
      throw new Error('出库日期不能为空且不能晚于今天');
    }

    for (const item of outbound.items) {
      if (item.outboundQuantity <= 0) throw new Error(`商品 ${item.productName} 实出数量必须大于 0`);
      if (item.outboundQuantity > item.orderPendingQuantity) {
        throw new Error(`商品 ${item.productName} 实出数量不能超过应出数量 ${item.orderPendingQuantity}`);
      }
    }

    outbound.status = 'CONFIRMED';
    outbound.confirmedBy = 'Storekeeper01';
    outbound.confirmedAt = getCurrentDateTime();
    outbound.updatedBy = 'Storekeeper01';
    outbound.updatedAt = getCurrentDateTime();

    applyOutboundInventory(order, outbound);

    order.items = order.items.map(orderItem => {
      const outItem = outbound.items.find(x => x.id === orderItem.id);
      if (!outItem) return orderItem;
      const outboundQuantity = orderItem.outboundQuantity + outItem.outboundQuantity;
      return {
        ...orderItem,
        outboundQuantity,
        pendingOutboundQuantity: Math.max(0, orderItem.quantity - outboundQuantity)
      };
    });
    order.status = order.items.every(it => it.pendingOutboundQuantity === 0) ? 'COMPLETED' : 'PARTIAL_OUTBOUND';
    order.updatedBy = 'Storekeeper01';
    order.updatedAt = getCurrentDateTime();
    orders[orderIdx] = refreshOrderTotals(order);
    saveLocalOrders(orders);

    const receivables = readTable<AccountReceivable>('accountsReceivable', []);
    receivables.unshift({
      id: `AR${todayCompact()}-${String(receivables.length + 1).padStart(4, '0')}`,
      salesOutboundId: outbound.id,
      customerName: outbound.customerName,
      amount: outbound.totalAmount,
      status: 'UNPAID',
      createdAt: getCurrentDateTime()
    });
    replaceTable('accountsReceivable', receivables);

    outbounds[idx] = outbound;
    saveLocalOutbounds(outbounds);
    return outbound;
  },

  voidSalesOutbound(id: string): SalesOutbound {
    const outbounds = getLocalOutbounds();
    const idx = outbounds.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('销售出库单不存在');
    const outbound = outbounds[idx];
    if (outbound.status !== 'DRAFT') throw new Error('只有草稿销售出库单可以作废');
    outbound.status = 'VOIDED';
    outbound.updatedBy = 'Storekeeper01';
    outbound.updatedAt = getCurrentDateTime();
    outbounds[idx] = outbound;
    saveLocalOutbounds(outbounds);
    return outbound;
  },

  getOutboundsBySalesOrder(orderId: string): SalesOutbound[] {
    return getLocalOutbounds().filter(o => o.salesOrderId === orderId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getInventoryFlows(outboundId: string): InventoryFlow[] {
    return getLocalInventoryFlows().filter(flow => flow.sourceId === outboundId);
  },

  getReceivableRecords(outboundId: string): AccountReceivable[] {
    return readTable<AccountReceivable>('accountsReceivable', []).filter(ar => ar.salesOutboundId === outboundId);
  },

  releaseApprovedOrderStock(id: string) {
    const order = this.getSalesOrderById(id);
    if (order && (order.status === 'APPROVED' || order.status === 'PARTIAL_OUTBOUND')) releaseStock(order);
  }
};
