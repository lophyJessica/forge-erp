import { readTable, replaceTable } from '../db';
import { MOCK_PRODUCTS, MOCK_SUPPLIERS, MOCK_WAREHOUSES, purchaseOrderApi } from './purchaseOrder';
import type { RfqAwardLine, RfqItem, RfqOrder, RfqQuoteLine, RfqStatus, RfqSupplierQuote } from '../types/rfq';
import type { TaxRate } from '../types/purchaseOrder';

const SUPPLIERS = MOCK_SUPPLIERS.slice(0, 4);
const DEFAULT_WAREHOUSE = MOCK_WAREHOUSES[0];

function now() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function generateRfqNumber(index: number) {
  const dateStr = '20260706';
  return `RFQ${dateStr}-${String(index).padStart(4, '0')}`;
}

function productItem(productCode: string, quantity: number, id: string): RfqItem {
  const product = MOCK_PRODUCTS.find(item => item.code === productCode) || MOCK_PRODUCTS[0];
  return {
    id,
    productCode: product.code,
    productName: product.name,
    productSpec: product.spec,
    unit: product.unit,
    quantity,
  };
}

function quoteLine(item: RfqItem, supplierIndex: number): RfqQuoteLine {
  const productIndex = MOCK_PRODUCTS.findIndex(product => product.code === item.productCode);
  const basePrice = MOCK_PRODUCTS[Math.max(0, productIndex)]?.defaultPurchasePrice || 10;
  return {
    itemId: item.id,
    unitPrice: Number((basePrice * (0.94 + supplierIndex * 0.035 + item.quantity / 10000)).toFixed(2)),
    deliveryDays: 2 + supplierIndex + (productIndex % 3),
    taxRate: (supplierIndex % 2 === 0 ? '13%' : '6%') as TaxRate,
  };
}

function buildQuotes(items: RfqItem[], supplierCount = 3, submitted = true): RfqSupplierQuote[] {
  return SUPPLIERS.slice(0, supplierCount).map((supplier, supplierIndex) => ({
    supplierCode: supplier.code,
    supplierName: supplier.name,
    status: submitted ? 'SUBMITTED' : 'PENDING',
    submittedAt: submitted ? `2026-07-0${Math.min(6, supplierIndex + 2)} 1${supplierIndex}:20:00` : undefined,
    lines: items.map(item => quoteLine(item, supplierIndex)),
  }));
}

const INITIAL_RFQS: RfqOrder[] = [
  {
    id: 'RFQ20260701-0001',
    title: '华北办公耗材季度询比价',
    deadline: '2026-07-08',
    status: 'QUOTING',
    itemCount: 3,
    createdBy: 'Buyer01',
    createdAt: '2026-07-01 09:10:00',
    updatedBy: 'Buyer01',
    updatedAt: '2026-07-01 09:40:00',
    items: [productItem('SKU001', 300, '1'), productItem('SKU002', 500, '2'), productItem('SKU003', 80, '3')],
    quotes: buildQuotes([productItem('SKU001', 300, '1'), productItem('SKU002', 500, '2'), productItem('SKU003', 80, '3')], 3),
  },
  {
    id: 'RFQ20260702-0001',
    title: '上海分仓电子配件补货询价',
    deadline: '2026-07-09',
    status: 'DRAFT',
    itemCount: 2,
    createdBy: 'Buyer02',
    createdAt: '2026-07-02 10:30:00',
    items: [productItem('SKU006', 60, '1'), productItem('SKU007', 40, '2')],
    quotes: buildQuotes([productItem('SKU006', 60, '1'), productItem('SKU007', 40, '2')], 3, false),
  },
  {
    id: 'RFQ20260703-0001',
    title: '广州包材和红笔促销备货比价',
    deadline: '2026-07-06',
    status: 'AWARDED',
    itemCount: 3,
    createdBy: 'Buyer01',
    createdAt: '2026-07-03 08:40:00',
    updatedBy: 'Buyer01',
    updatedAt: '2026-07-04 11:20:00',
    items: [productItem('SKU003', 120, '1'), productItem('SKU005', 600, '2'), productItem('SKU001', 200, '3')],
    quotes: buildQuotes([productItem('SKU003', 120, '1'), productItem('SKU005', 600, '2'), productItem('SKU001', 200, '3')], 4),
    awards: [
      { itemId: '1', supplierCode: 'VEND001' },
      { itemId: '2', supplierCode: 'VEND004' },
      { itemId: '3', supplierCode: 'VEND001' },
    ],
  },
  {
    id: 'RFQ20260704-0001',
    title: '成都温江仓计算器专项询价',
    deadline: '2026-07-11',
    status: 'QUOTING',
    itemCount: 1,
    createdBy: 'Buyer03',
    createdAt: '2026-07-04 14:15:00',
    updatedBy: 'Buyer03',
    updatedAt: '2026-07-04 15:00:00',
    items: [productItem('SKU004', 50, '1')],
    quotes: buildQuotes([productItem('SKU004', 50, '1')], 3),
  },
  {
    id: 'RFQ20260705-0001',
    title: '重复需求作废询价单',
    deadline: '2026-07-07',
    status: 'VOIDED',
    itemCount: 2,
    createdBy: 'Buyer02',
    createdAt: '2026-07-05 09:30:00',
    updatedBy: 'Buyer02',
    updatedAt: '2026-07-05 10:00:00',
    voidReason: '采购需求重复合并至 RFQ20260701-0001',
    items: [productItem('SKU001', 100, '1'), productItem('SKU002', 100, '2')],
    quotes: buildQuotes([productItem('SKU001', 100, '1'), productItem('SKU002', 100, '2')], 3),
  },
];

function getRfqs() {
  return readTable<RfqOrder>('rfqs', INITIAL_RFQS);
}

function saveRfqs(rows: RfqOrder[]) {
  replaceTable<RfqOrder>('rfqs', rows);
}

function touch(row: RfqOrder): RfqOrder {
  return {
    ...row,
    itemCount: row.items.length,
    updatedBy: 'Admin',
    updatedAt: now(),
  };
}

export const rfqApi = {
  getList(status?: RfqStatus | 'ALL') {
    let rows = getRfqs();
    if (status && status !== 'ALL') {
      rows = rows.filter(row => row.status === status);
    }
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getById(id: string) {
    return getRfqs().find(row => row.id === id) || null;
  },

  create(payload: Pick<RfqOrder, 'title' | 'deadline' | 'items'>, publish = false) {
    const rows = getRfqs();
    const nextIndex = rows.filter(row => row.id.startsWith('RFQ20260706')).length + 1;
    const row: RfqOrder = {
      id: generateRfqNumber(nextIndex),
      title: payload.title,
      deadline: payload.deadline,
      status: publish ? 'QUOTING' : 'DRAFT',
      itemCount: payload.items.length,
      createdBy: 'Admin',
      createdAt: now(),
      updatedBy: 'Admin',
      updatedAt: now(),
      items: payload.items,
      quotes: buildQuotes(payload.items, 3, false),
    };
    saveRfqs([row, ...rows]);
    return row;
  },

  update(id: string, payload: Pick<RfqOrder, 'title' | 'deadline' | 'items'>) {
    const rows = getRfqs();
    const index = rows.findIndex(row => row.id === id);
    if (index === -1) throw new Error('询价单不存在');
    if (rows[index].status !== 'DRAFT') throw new Error('只有草稿询价单可以编辑');
    rows[index] = touch({
      ...rows[index],
      title: payload.title,
      deadline: payload.deadline,
      items: payload.items,
      quotes: buildQuotes(payload.items, 3, false),
    });
    saveRfqs(rows);
    return rows[index];
  },

  publish(id: string) {
    const rows = getRfqs();
    const row = rows.find(item => item.id === id);
    if (!row) throw new Error('询价单不存在');
    if (row.status !== 'DRAFT') throw new Error('只有草稿询价单可以发布');
    row.status = 'QUOTING';
    row.updatedBy = 'Admin';
    row.updatedAt = now();
    saveRfqs(rows);
    return row;
  },

  void(id: string, reason = '业务取消') {
    const rows = getRfqs();
    const row = rows.find(item => item.id === id);
    if (!row) throw new Error('询价单不存在');
    if (row.status === 'AWARDED') throw new Error('已定标询价单不可作废');
    row.status = 'VOIDED';
    row.voidReason = reason;
    row.updatedBy = 'Admin';
    row.updatedAt = now();
    saveRfqs(rows);
    return row;
  },

  submitQuote(rfqId: string, supplierCode: string, lines: RfqQuoteLine[]) {
    const rows = getRfqs();
    const row = rows.find(item => item.id === rfqId);
    if (!row) throw new Error('询价单不存在');
    if (row.status !== 'QUOTING') throw new Error('当前询价单不在报价期');
    const supplier = MOCK_SUPPLIERS.find(item => item.code === supplierCode);
    if (!supplier) throw new Error('供应商不存在');

    const nextQuote: RfqSupplierQuote = {
      supplierCode,
      supplierName: supplier.name,
      status: 'SUBMITTED',
      submittedAt: now(),
      lines,
    };
    const quoteIndex = row.quotes.findIndex(item => item.supplierCode === supplierCode);
    if (quoteIndex >= 0) {
      row.quotes[quoteIndex] = nextQuote;
    } else {
      row.quotes.push(nextQuote);
    }
    row.updatedBy = supplier.name;
    row.updatedAt = now();
    saveRfqs(rows);
    return row;
  },

  awardAndCreatePo(rfqId: string, awards: RfqAwardLine[]) {
    const rows = getRfqs();
    const row = rows.find(item => item.id === rfqId);
    if (!row) throw new Error('询价单不存在');
    if (row.status !== 'QUOTING' && row.status !== 'AWARDED') throw new Error('只有询价中或已定标询价单可以定标');
    if (awards.length !== row.items.length) throw new Error('每个商品行都必须选择中标供应商');

    const grouped = new Map<string, RfqAwardLine[]>();
    awards.forEach(award => {
      grouped.set(award.supplierCode, [...(grouped.get(award.supplierCode) || []), award]);
    });

    const createdPoIds: string[] = [];
    grouped.forEach((supplierAwards, supplierCode) => {
      const supplier = MOCK_SUPPLIERS.find(item => item.code === supplierCode);
      if (!supplier) throw new Error('中标供应商不存在');

      const poItems = supplierAwards.map((award, index) => {
        const rfqItem = row.items.find(item => item.id === award.itemId);
        const quote = row.quotes
          .find(item => item.supplierCode === supplierCode)
          ?.lines.find(line => line.itemId === award.itemId);
        if (!rfqItem || !quote) throw new Error('中标报价不完整，无法生成采购订单');
        const product = MOCK_PRODUCTS.find(item => item.code === rfqItem.productCode);
        return {
          id: `${rfqItem.id}-${index}`,
          productCode: rfqItem.productCode,
          productName: rfqItem.productName,
          productBarcode: product?.barcode || '',
          productSpec: rfqItem.productSpec,
          unit: rfqItem.unit,
          quantity: rfqItem.quantity,
          price: quote.unitPrice,
          taxRate: quote.taxRate,
          amount: Number((rfqItem.quantity * quote.unitPrice).toFixed(2)),
          receivedQuantity: 0,
          pendingQuantity: rfqItem.quantity,
          remark: `来源询价单 ${row.id}`,
        };
      });

      const po = purchaseOrderApi.createOrder({
        supplierCode,
        supplierName: supplier.name,
        warehouseCode: DEFAULT_WAREHOUSE.code,
        warehouseName: DEFAULT_WAREHOUSE.name,
        orderDate: today(),
        expectedDeliveryDate: row.deadline,
        remark: `由询价定标自动生成，来源 ${row.id}`,
        items: poItems,
      });
      createdPoIds.push(po.id);
    });

    row.status = 'AWARDED';
    row.awards = awards;
    row.convertedPoIds = Array.from(new Set([...(row.convertedPoIds || []), ...createdPoIds]));
    row.updatedBy = 'Admin';
    row.updatedAt = now();
    saveRfqs(rows);
    return { rfq: row, poIds: createdPoIds };
  },
};
