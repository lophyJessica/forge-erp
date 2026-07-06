import { PurchaseReturnOutbound, PurchaseReturnOutboundItem, PurchaseReturnOutboundStatus } from '../types/purchaseReturnOutbound';
import { purchaseReturnApi } from './purchaseReturn';
import { stockInApi } from './stockIn';
import { InventoryFlow, InstantStock } from '../types/stockIn';
import { readTable, replaceTable, type AccountPayable } from '../db';

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

function getLocalOutbounds(): PurchaseReturnOutbound[] {
  return readTable('returnOutbounds', getInitialOutbounds());
}

function saveLocalOutbounds(list: PurchaseReturnOutbound[]) {
  replaceTable('returnOutbounds', list);
}

function getInitialOutbounds(): PurchaseReturnOutbound[] {
  return [
    {
      id: 'PRO20260704-0001',
      sourceReturnId: 'PR20260704-0001',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      outboundDate: '2026-07-04',
      remark: '外包装破损件实物已退回，厂家顺丰取件',
      status: 'CONFIRMED',
      itemCount: 1,
      totalQuantity: 20,
      totalAmount: 50.00,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 14:00:00',
      confirmedBy: 'Storekeeper01',
      confirmedAt: '2026-07-04 14:30:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          returnQuantity: 20,
          outboundQuantity: 20,
          price: 2.5,
          amount: 50.00,
          remark: '第一批破损回退'
        }
      ]
    },
    {
      id: 'PRO20260704-0002',
      sourceReturnId: 'PR20260704-0001',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      outboundDate: '2026-07-04',
      remark: '备用单据',
      status: 'DRAFT',
      itemCount: 1,
      totalQuantity: 5,
      totalAmount: 12.50,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 15:00:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          returnQuantity: 20,
          outboundQuantity: 5,
          price: 2.5,
          amount: 12.50,
          remark: '备用'
        }
      ]
    },
    {
      id: 'PRO20260704-0003',
      sourceReturnId: 'PR20260704-0001',
      supplierCode: 'VEND001',
      supplierName: '北京强盛贸易有限公司',
      warehouseCode: 'WH001',
      warehouseName: '北京主仓',
      outboundDate: '2026-07-04',
      remark: '作废测试',
      status: 'VOIDED',
      itemCount: 1,
      totalQuantity: 5,
      totalAmount: 12.50,
      createdBy: 'Storekeeper01',
      createdAt: '2026-07-04 15:30:00',
      updatedBy: 'Storekeeper01',
      updatedAt: '2026-07-04 15:45:00',
      items: [
        {
          id: '1',
          productCode: 'SKU001',
          productName: '双鸭牌标准型回形针',
          productBarcode: '6901234567890',
          productSpec: '100枚/盒',
          unit: '盒',
          returnQuantity: 20,
          outboundQuantity: 5,
          price: 2.5,
          amount: 12.50,
          remark: '数量填错作废'
        }
      ]
    },
    {
      id: 'PRO20260705-0001',
      sourceReturnId: 'PR20260705-0001',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      outboundDate: '2026-07-05',
      remark: '漏墨笔实物退货出库完成',
      status: 'CONFIRMED',
      itemCount: 1,
      totalQuantity: 30,
      totalAmount: 60.00,
      createdBy: 'Storekeeper02',
      createdAt: '2026-07-05 10:00:00',
      confirmedBy: 'Storekeeper02',
      confirmedAt: '2026-07-05 10:15:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          returnQuantity: 30,
          outboundQuantity: 30,
          price: 2.0,
          amount: 60.00,
          remark: '漏墨中性笔出库'
        }
      ]
    },
    {
      id: 'PRO20260705-0002',
      sourceReturnId: 'PR20260705-0001',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      outboundDate: '2026-07-05',
      remark: '漏墨中性笔备用出库',
      status: 'DRAFT',
      itemCount: 1,
      totalQuantity: 10,
      totalAmount: 20.00,
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
          returnQuantity: 30,
          outboundQuantity: 10,
          price: 2.0,
          amount: 20.00,
          remark: '草稿'
        }
      ]
    },
    {
      id: 'PRO20260705-0003',
      sourceReturnId: 'PR20260705-0001',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      outboundDate: '2026-07-05',
      remark: '作废演示',
      status: 'VOIDED',
      itemCount: 1,
      totalQuantity: 10,
      totalAmount: 20.00,
      createdBy: 'Storekeeper02',
      createdAt: '2026-07-05 11:30:00',
      updatedBy: 'Storekeeper02',
      updatedAt: '2026-07-05 11:40:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          returnQuantity: 30,
          outboundQuantity: 10,
          price: 2.0,
          amount: 20.00,
          remark: '废单'
        }
      ]
    },
    {
      id: 'PRO20260705-0004',
      sourceReturnId: 'PR20260705-0001',
      supplierCode: 'VEND002',
      supplierName: '广州晨光文具分销商',
      warehouseCode: 'WH003',
      warehouseName: '广州越秀仓',
      outboundDate: '2026-07-05',
      remark: '备用草稿退货出库单',
      status: 'DRAFT',
      itemCount: 1,
      totalQuantity: 12,
      totalAmount: 24.00,
      createdBy: 'Storekeeper02',
      createdAt: '2026-07-05 13:00:00',
      items: [
        {
          id: '1',
          productCode: 'SKU002',
          productName: '晨光按动式中性笔黑色',
          productBarcode: '6902345678901',
          productSpec: '0.5mm',
          unit: '支',
          returnQuantity: 30,
          outboundQuantity: 12,
          price: 2.0,
          amount: 24.00,
          remark: '未确认草稿'
        }
      ]
    }
  ];
}

export const purchaseReturnOutboundApi = {
  // 1. 获取列表
  getOutbounds(filters: {
    status?: PurchaseReturnOutboundStatus | 'ALL' | '';
    proNumber?: string;
    sourceReturnId?: string;
    supplierCode?: string;
    warehouseCode?: string;
    outboundDateStart?: string;
    outboundDateEnd?: string;
  } = {}): PurchaseReturnOutbound[] {
    let list = getLocalOutbounds();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(x => x.status === filters.status);
    }
    if (filters.proNumber) {
      list = list.filter(x => x.id.toLowerCase().includes(filters.proNumber!.toLowerCase().trim()));
    }
    if (filters.sourceReturnId) {
      list = list.filter(x => x.sourceReturnId.toLowerCase().includes(filters.sourceReturnId!.toLowerCase().trim()));
    }
    if (filters.supplierCode) {
      list = list.filter(x => x.supplierCode === filters.supplierCode);
    }
    if (filters.warehouseCode) {
      list = list.filter(x => x.warehouseCode === filters.warehouseCode);
    }
    if (filters.outboundDateStart) {
      list = list.filter(x => x.outboundDate >= filters.outboundDateStart!);
    }
    if (filters.outboundDateEnd) {
      list = list.filter(x => x.outboundDate <= filters.outboundDateEnd!);
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // 2. 根据ID获取
  getOutboundById(id: string): PurchaseReturnOutbound | null {
    const list = getLocalOutbounds();
    return list.find(x => x.id === id) || null;
  },

  // 3. 从退货单(PR)下推生成出库单草稿
  createOutboundFromPR(prId: string): PurchaseReturnOutbound {
    const pr = purchaseReturnApi.getReturnById(prId);
    if (!pr) throw new Error(`采购退货单 ${prId} 不存在`);
    if (pr.status !== 'CONFIRMED') {
      throw new Error(`退货单 ${prId} 当前状态为【${pr.status}】，只有已确认的退货单才可进行出库`);
    }

    const items: PurchaseReturnOutboundItem[] = pr.items.map(it => ({
      id: it.id,
      productCode: it.productCode,
      productName: it.productName,
      productBarcode: it.productBarcode,
      productSpec: it.productSpec,
      unit: it.unit,
      returnQuantity: it.returnQuantity,
      outboundQuantity: it.returnQuantity, // 默认推荐出全量
      price: it.price,
      amount: parseFloat((it.returnQuantity * it.price).toFixed(2)),
      remark: ''
    }));

    const list = getLocalOutbounds();
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const proNumber = `PRO${today}-${String(list.length + 1).padStart(4, '0')}`;

    const newPRO: PurchaseReturnOutbound = {
      id: proNumber,
      sourceReturnId: pr.id,
      supplierCode: pr.supplierCode,
      supplierName: pr.supplierName,
      warehouseCode: pr.warehouseCode,
      warehouseName: pr.warehouseName,
      outboundDate: new Date().toISOString().split('T')[0],
      remark: '',
      status: 'DRAFT',
      itemCount: items.length,
      totalQuantity: items.reduce((sum, it) => sum + it.outboundQuantity, 0),
      totalAmount: parseFloat(items.reduce((sum, it) => sum + it.amount, 0).toFixed(2)),
      createdBy: 'Storekeeper01',
      createdAt: getCurrentDateTime(),
      items
    };

    return newPRO;
  },

  // 4. 保存草稿
  saveOutbound(data: PurchaseReturnOutbound): PurchaseReturnOutbound {
    const list = getLocalOutbounds();
    const idx = list.findIndex(x => x.id === data.id);

    const items = data.items.map(it => ({
      ...it,
      amount: parseFloat((it.outboundQuantity * it.price).toFixed(2))
    }));

    const finalData: PurchaseReturnOutbound = {
      ...data,
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, it) => sum + it.outboundQuantity, 0),
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

    saveLocalOutbounds(list);
    return finalData;
  },

  // 5. 确认出库（更新状态 + 扣减库存 + 冲减财务应付 + 生成库存流水FL）
  confirmOutbound(id: string, data?: PurchaseReturnOutbound): PurchaseReturnOutbound {
    const list = getLocalOutbounds();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('单据不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿状态的单据支持确认出库');

    let current = list[idx];
    if (data) {
      // 校验出库数量
      data.items.forEach(it => {
        if (it.outboundQuantity <= 0) {
          throw new Error(`商品 ${it.productName} 的出库数量必须大于0`);
        }
        if (it.outboundQuantity > it.returnQuantity) {
          throw new Error(`商品 ${it.productName} 出库数量不能大于退货单申请退货数 (${it.returnQuantity})`);
        }
      });
      current = this.saveOutbound(data);
    }

    // 执行状态流转
    current.status = 'CONFIRMED';
    current.confirmedBy = 'Storekeeper01';
    current.confirmedAt = getCurrentDateTime();
    current.updatedAt = getCurrentDateTime();
    current.updatedBy = 'Storekeeper01';

    // --- 联动机制：1. 扣减即时库存 ---
    const stocks: InstantStock[] = stockInApi.getInstantStocks();
    current.items.forEach(it => {
      // 在即时库存中定位商品与仓库匹配的记录（不细分批次或按出库批次匹配）
      const stockIdx = stocks.findIndex(s => s.productCode === it.productCode && s.warehouseCode === current.warehouseCode);
      if (stockIdx !== -1) {
        stocks[stockIdx].quantity -= it.outboundQuantity;
        stocks[stockIdx].available = stocks[stockIdx].quantity - stocks[stockIdx].occupied;
        stocks[stockIdx].lastChangedAt = getCurrentDateTime();
      } else {
        // 若不存在该仓商品库存，则初始化为负库存倒挂
        stocks.unshift({
          id: `${it.productCode}-${current.warehouseCode}-NONE`,
          productCode: it.productCode,
          productName: it.productName,
          productSpec: it.productSpec,
          unit: it.unit,
          warehouseCode: current.warehouseCode,
          warehouseName: current.warehouseName,
          batchNo: '-',
          quantity: -it.outboundQuantity,
          occupied: 0,
          available: -it.outboundQuantity,
          safetyStock: '-',
          lastChangedAt: getCurrentDateTime()
        });
      }
    });
    replaceTable('instantStocks', stocks);

    // --- 联动机制：2. 冲减财务应付账款 ---
    const payables = readTable<AccountPayable>('accountsPayable', []);
    const apId = `AP${getCurrentDateTime().split(' ')[0].replace(/-/g, '')}-${String(payables.length + 1).padStart(4, '0')}`;
    payables.unshift({
      id: apId,
      stockInId: current.id, // 用PRO出库单号关联
      supplierName: current.supplierName,
      amount: -current.totalAmount, // 负数金额冲减应付
      status: 'UNPAID', // 未结算
      createdAt: getCurrentDateTime()
    });
    replaceTable('accountsPayable', payables);

    // --- 联动机制：3. 产生库存发货流水 ---
    const flows: InventoryFlow[] = stockInApi.getGlobalInventoryFlows();
    current.items.forEach(it => {
      const flowId = `FL${getCurrentDateTime().split(' ')[0].replace(/-/g, '')}-${String(flows.length + 1).padStart(8, '0')}`;
      flows.unshift({
        id: flowId,
        createdAt: getCurrentDateTime(),
        warehouseCode: current.warehouseCode,
        warehouseName: current.warehouseName,
        productCode: it.productCode,
        productName: it.productName,
        productSpec: it.productSpec,
        unit: it.unit,
        changeType: 'PRO', // 采购退货出库变动类型
        quantity: -it.outboundQuantity, // 负数出库
        postQuantity: 100 - it.outboundQuantity, // 模拟变动后现存
        sourceId: current.id,
        operator: current.confirmedBy || 'Storekeeper01',
        batchNo: '-'
      });
    });
    replaceTable('inventoryFlows', flows);

    list[idx] = current;
    saveLocalOutbounds(list);
    return current;
  },

  // 6. 手动作废草稿
  voidOutbound(id: string): PurchaseReturnOutbound {
    const list = getLocalOutbounds();
    const idx = list.findIndex(x => x.id === id);
    if (idx === -1) throw new Error('单据不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿状态的退货出库单允许作废');

    const draft = list[idx];
    draft.status = 'VOIDED';
    draft.updatedAt = getCurrentDateTime();
    draft.updatedBy = 'Storekeeper01';

    list[idx] = draft;
    saveLocalOutbounds(list);
    return draft;
  },

  // 7. 物理删除草稿
  deleteOutbound(id: string) {
    let list = getLocalOutbounds();
    const target = list.find(x => x.id === id);
    if (!target) throw new Error('单据不存在');
    if (target.status !== 'DRAFT') throw new Error('只有草稿状态的退货出库单可以物理删除');

    list = list.filter(x => x.id !== id);
    saveLocalOutbounds(list);
  },

  // 8. 获取指定退货单(PR)关联的所有出库单
  getOutboundsByPR(prId: string): PurchaseReturnOutbound[] {
    const list = getLocalOutbounds();
    return list.filter(x => x.sourceReturnId === prId);
  }
};
