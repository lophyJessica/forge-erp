import { PurchaseReturn, PurchaseReturnItem, PurchaseReturnStatus } from '../types/purchaseReturn';
import { stockInApi } from './stockIn';
import { readTable, replaceTable } from '../db';

// 获取当前时间 YYYY-MM-DD HH:mm:ss
function getCurrentDateTime(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function getLocalReturns(): PurchaseReturn[] {
  return readTable('purchaseReturns', getInitialReturns());
}

function saveLocalReturns(list: PurchaseReturn[]) {
  replaceTable('purchaseReturns', list);
}

function getInitialReturns(): PurchaseReturn[] {
  return [
    {
      id: 'PR20260704-0001',
      sourceStockInId: 'PI20260704-0005',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      returnDate: '2026-07-04',
      returnReason: '外包装严重破损，导致回形针生锈，无法销售',
      status: 'CONFIRMED',
      itemCount: 1,
      totalQuantity: 20,
      totalAmount: 50.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 10:30:00',
      confirmedBy: 'Storekeeper01',
      confirmedAt: '2026-07-04 10:45:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          receivedQuantity: 50,
          returnQuantity: 20,
          price: 2.5,
          amount: 50.00,
          remark: '第一批破损生锈退货'
        }
      ]
    },
    {
      id: 'PR20260704-0002',
      sourceStockInId: 'PI20260704-0005',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      returnDate: '2026-07-04',
      returnReason: '商品批次规格发错，经沟通予以退回',
      status: 'DRAFT',
      itemCount: 1,
      totalQuantity: 5,
      totalAmount: 12.50,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 11:00:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          receivedQuantity: 50,
          returnQuantity: 5,
          price: 2.5,
          amount: 12.50,
          remark: '规格错误协商退货'
        }
      ]
    },
    {
      id: 'PR20260704-0003',
      sourceStockInId: 'PI20260704-0005',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      returnDate: '2026-07-04',
      returnReason: '测试单据作废流程使用',
      status: 'VOIDED',
      itemCount: 1,
      totalQuantity: 10,
      totalAmount: 25.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 11:30:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-07-04 11:45:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          receivedQuantity: 50,
          returnQuantity: 10,
          price: 2.5,
          amount: 25.00,
          remark: '录错单作废'
        }
      ]
    },
    {
      id: 'PR20260705-0001',
      sourceStockInId: 'PI20260704-0004',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      returnDate: '2026-07-05',
      returnReason: '晨光按动式中性笔部分漏墨严重，无法通过质检',
      status: 'CONFIRMED',
      itemCount: 1,
      totalQuantity: 30,
      totalAmount: 60.00,
      createdBy: 'Storekeeper02',
      createdAt: '2026-07-05 09:00:00',
      confirmedBy: 'Storekeeper02',
      confirmedAt: '2026-07-05 09:15:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          receivedQuantity: 100,
          returnQuantity: 30,
          price: 2.0,
          amount: 60.00,
          remark: '漏墨退货'
        }
      ]
    },
    {
      id: 'PR20260705-0002',
      sourceStockInId: 'PI20260704-0004',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      returnDate: '2026-07-05',
      returnReason: '中性笔笔芯不符要求，经采购协商退货',
      status: 'DRAFT',
      itemCount: 1,
      totalQuantity: 10,
      totalAmount: 20.00,
      createdBy: 'Storekeeper02',
      createdAt: '2026-07-05 10:00:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          receivedQuantity: 100,
          returnQuantity: 10,
          price: 2.0,
          amount: 20.00,
          remark: '备用草稿退货'
        }
      ]
    },
    {
      id: 'PR20260705-0003',
      sourceStockInId: 'PI20260704-0004',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      returnDate: '2026-07-05',
      returnReason: '测试作废单据',
      status: 'VOIDED',
      itemCount: 1,
      totalQuantity: 50,
      totalAmount: 100.00,
      createdBy: 'Storekeeper02',
      createdAt: '2026-07-05 10:30:00',
      updatedBy: 'Storekeeper02',
      updatedAt: '2026-07-05 10:40:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          receivedQuantity: 100,
          returnQuantity: 50,
          price: 2.0,
          amount: 100.00,
          remark: '数量输错作废'
        }
      ]
    },
    {
      id: 'PR20260705-0004',
      sourceStockInId: 'PI20260704-0004',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      returnDate: '2026-07-05',
      returnReason: '第三批办公用品局部退回',
      status: 'DRAFT',
      itemCount: 1,
      totalQuantity: 15,
      totalAmount: 30.00,
      createdBy: 'Storekeeper02',
      createdAt: '2026-07-05 11:00:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          receivedQuantity: 100,
          returnQuantity: 15,
          price: 2.0,
          amount: 30.00,
          remark: '笔芯笔夹异常退货'
        }
      ]
    }
  ];
}

export const purchaseReturnApi = {
  // 1. 获取退货单列表
  getReturns(filters: {
    status?: PurchaseReturnStatus | 'ALL' | '';
    prNumber?: string;
    sourceStockInId?: string;
    supplierCode?: string;
    warehouseCode?: string;
    returnDateStart?: string;
    returnDateEnd?: string;
    updatedDateStart?: string;
    updatedDateEnd?: string;
  } = {}): PurchaseReturn[] {
    let list = getLocalReturns();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(x => x.status === filters.status);
    }
    if (filters.prNumber) {
      list = list.filter(x => x.id.toLowerCase().includes(filters.prNumber!.toLowerCase().trim()));
    }
    if (filters.sourceStockInId) {
      list = list.filter(x => x.sourceStockInId.toLowerCase().includes(filters.sourceStockInId!.toLowerCase().trim()));
    }
    if (filters.supplierCode) {
      list = list.filter(x => x.supplierCode === filters.supplierCode);
    }
    if (filters.warehouseCode) {
      list = list.filter(x => x.warehouseCode === filters.warehouseCode);
    }
    if (filters.returnDateStart) {
      list = list.filter(x => x.returnDate >= filters.returnDateStart!);
    }
    if (filters.returnDateEnd) {
      list = list.filter(x => x.returnDate <= filters.returnDateEnd!);
    }
    if (filters.updatedDateStart) {
      list = list.filter(x => (x.updatedAt || x.createdAt).split(' ')[0] >= filters.updatedDateStart!);
    }
    if (filters.updatedDateEnd) {
      list = list.filter(x => (x.updatedAt || x.createdAt).split(' ')[0] <= filters.updatedDateEnd!);
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // 2. 根据ID获取退货单
  getReturnById(id: string): PurchaseReturn | null {
    const list = getLocalReturns();
    return list.find(x => x.id === id) || null;
  },

  // 3. 从入库单(PI)下推生成退货单草稿
  createReturnFromPI(piId: string): PurchaseReturn {
    const pi = stockInApi.getStockInById(piId);
    if (!pi) throw new Error(`采购入库单 ${piId} 不存在`);
    if (pi.status !== 'CONFIRMED') {
      throw new Error(`入库单 ${piId} 当前状态为【${pi.status}】，只有已确认的入库单才可以进行退货`);
    }

    // 默认明细行退货数量继承自已入库数量
    const items: PurchaseReturnItem[] = pi.items.map(it => ({
      id: it.id,
      productCode: it.productCode,
      productName: it.productName,
      productBarcode: it.productBarcode,
      productSpec: it.productSpec,
      unit: it.unit,
      receivedQuantity: it.stockInQuantity, // PI中最终入库数量为PR的已入库数量
      returnQuantity: it.stockInQuantity, // 默认推荐退全量
      price: it.price,
      amount: parseFloat((it.stockInQuantity * it.price).toFixed(2)),
      remark: ''
    }));

    const list = getLocalReturns();
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prNumber = `PR${today}-${String(list.length + 1).padStart(4, '0')}`;

    const newPR: PurchaseReturn = {
      id: prNumber,
      sourceStockInId: pi.id,
      supplierCode: pi.supplierCode,
      supplierName: pi.supplierName,
      warehouseCode: pi.warehouseCode,
      warehouseName: pi.warehouseName,
      returnDate: new Date().toISOString().split('T')[0],
      returnReason: '',
      status: 'DRAFT',
      itemCount: items.length,
      totalQuantity: items.reduce((sum, it) => sum + it.returnQuantity, 0),
      totalAmount: parseFloat(items.reduce((sum, it) => sum + it.amount, 0).toFixed(2)),
      createdBy: 'Storekeeper01',
      createdAt: getCurrentDateTime(),
      items
    };

    return newPR;
  },

  // 4. 保存退货单草稿（新建或修改）
  saveReturn(data: PurchaseReturn): PurchaseReturn {
    const list = getLocalReturns();
    const idx = list.findIndex(x => x.id === data.id);

    const items = data.items.map(it => ({
      ...it,
      amount: parseFloat((it.returnQuantity * it.price).toFixed(2))
    }));

    const finalData: PurchaseReturn = {
      ...data,
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, it) => sum + it.returnQuantity, 0),
      totalAmount: parseFloat(items.reduce((sum, it) => sum + it.amount, 0).toFixed(2)),
      updatedAt: getCurrentDateTime(),
      updatedBy: 'Storekeeper01'
    };

    if (idx === -1) {
      list.unshift(finalData);
    } else {
      if (list[idx].status !== 'DRAFT') {
        throw new Error('只有草稿状态的单据可以编辑保存');
      }
      list[idx] = finalData;
    }

    saveLocalReturns(list);
    return finalData;
  },

  // 5. 确认退货（更新状态为已确认）
  confirmReturn(id: string, data?: PurchaseReturn): PurchaseReturn {
    const list = getLocalReturns();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('单据不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿状态的单据支持确认退货');

    let current = list[idx];
    if (data) {
      // 校验退货原因必填（0-200字）
      if (!data.returnReason.trim()) {
        throw new Error('退货原因不能为空');
      }
      if (data.returnReason.length > 200) {
        throw new Error('退货原因不能超过200个字符');
      }

      // 数量校验
      data.items.forEach(it => {
        if (it.returnQuantity <= 0) {
          throw new Error(`商品 ${it.productName} 的退货数量必须大于0`);
        }
        if (it.returnQuantity > it.receivedQuantity) {
          throw new Error(`商品 ${it.productName} 退货数量不能大于已入库数量 (${it.receivedQuantity})`);
        }
      });

      // 先保存为草稿最新版
      current = this.saveReturn(data);
    } else {
      if (!current.returnReason.trim()) {
        throw new Error('退货原因不能为空');
      }
    }

    current.status = 'CONFIRMED';
    current.confirmedBy = 'Storekeeper01';
    current.confirmedAt = getCurrentDateTime();
    current.updatedAt = getCurrentDateTime();
    current.updatedBy = 'Storekeeper01';

    list[idx] = current;
    saveLocalReturns(list);
    return current;
  },

  // 6. 手动作废草稿
  voidReturn(id: string): PurchaseReturn {
    const list = getLocalReturns();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('单据不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿状态的退货单允许作废');

    const draft = list[idx];
    draft.status = 'VOIDED';
    draft.updatedAt = getCurrentDateTime();
    draft.updatedBy = 'Storekeeper01';

    list[idx] = draft;
    saveLocalReturns(list);
    return draft;
  },

  // 7. 物理删除草稿
  deleteReturn(id: string) {
    let list = getLocalReturns();
    const target = list.find(x => x.id === id);
    if (!target) throw new Error('单据不存在');
    if (target.status !== 'DRAFT') throw new Error('只有草稿状态的退货单可以物理删除');

    list = list.filter(x => x.id !== id);
    saveLocalReturns(list);
  },

  // 8. 获取指定入库单(PI)下推生成的所有退货单
  getReturnsByPI(piId: string): PurchaseReturn[] {
    const list = getLocalReturns();
    return list.filter(x => x.sourceStockInId === piId);
  }
};
