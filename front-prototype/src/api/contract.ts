import { baseDataApi } from './baseData';
import type { Contract, ContractStatus, ContractType } from '../types/contract';

const STORAGE_KEY = 'qs_contracts_v1';
const OPERATOR = 'ContractAdmin';

function today() {
  return new Date().toISOString().split('T')[0];
}

function now() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function compactDate(value = today()) {
  return value.replaceAll('-', '');
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function generateContractId(list: Contract[]) {
  const prefix = `CT${compactDate()}`;
  const max = list
    .filter(item => item.id.startsWith(prefix))
    .map(item => Number(item.id.split('-')[1] || 0))
    .reduce((acc, value) => Math.max(acc, Number.isNaN(value) ? 0 : value), 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

function initialContracts(): Contract[] {
  return [
    {
      id: 'CT20260115-0001',
      name: '北京晨光文具年度供货合同',
      type: 'SALES',
      counterpartyCode: 'CUST001',
      counterpartyName: '北京晨光文具加盟店',
      amount: 286000,
      signDate: '2026-01-15',
      expireDate: '2026-12-31',
      status: 'ACTIVE',
      scanFileName: '北京晨光文具年度供货合同.pdf',
      remark: '覆盖办公文具常规供货，月度对账。',
      createdBy: 'ContractAdmin',
      createdAt: '2026-01-15 09:20:00',
      activatedBy: 'ContractAdmin',
      activatedAt: '2026-01-15 09:35:00'
    },
    {
      id: 'CT20260210-0001',
      name: '上海腾飞电子配件采购框架合同',
      type: 'PURCHASE',
      counterpartyCode: 'VEND002',
      counterpartyName: '上海腾飞电子器材厂',
      amount: 168000,
      signDate: '2026-02-10',
      expireDate: '2026-11-30',
      status: 'ACTIVE',
      scanFileName: '上海腾飞电子配件采购框架合同.pdf',
      remark: 'U盘及电子周边年度采购框架。',
      createdBy: 'ContractAdmin',
      createdAt: '2026-02-10 10:15:00',
      activatedBy: 'ContractAdmin',
      activatedAt: '2026-02-10 10:30:00'
    },
    {
      id: 'CT20260305-0001',
      name: '广州力行包装物料采购合同',
      type: 'PURCHASE',
      counterpartyCode: 'VEND003',
      counterpartyName: '广州力行包装材料公司',
      amount: 92000,
      signDate: '2026-03-05',
      expireDate: '2026-06-30',
      status: 'EXPIRED',
      scanFileName: '广州力行包装物料采购合同.pdf',
      remark: '上半年包装物料采购，已自然到期。',
      createdBy: 'ContractAdmin',
      createdAt: '2026-03-05 14:05:00',
      activatedBy: 'ContractAdmin',
      activatedAt: '2026-03-05 14:18:00'
    },
    {
      id: 'CT20260418-0001',
      name: '上海好德连锁供货合同',
      type: 'SALES',
      counterpartyCode: 'CUST002',
      counterpartyName: '上海好德便利店连锁',
      amount: 420000,
      signDate: '2026-04-18',
      expireDate: '2027-04-17',
      status: 'DRAFT',
      scanFileName: '上海好德连锁供货合同-草稿.docx',
      remark: '法务待确认账期条款。',
      createdBy: 'ContractAdmin',
      createdAt: '2026-04-18 16:45:00'
    },
    {
      id: 'CT20260520-0001',
      name: '深圳卓越办公设备联合销售合同',
      type: 'SALES',
      counterpartyCode: 'CUST004',
      counterpartyName: '深圳卓越办公设备行',
      amount: 318000,
      signDate: '2026-05-20',
      expireDate: '2026-12-20',
      status: 'TERMINATED',
      scanFileName: '深圳卓越办公设备联合销售合同.pdf',
      remark: '因渠道策略调整提前终止。',
      createdBy: 'ContractAdmin',
      createdAt: '2026-05-20 11:10:00',
      activatedBy: 'ContractAdmin',
      activatedAt: '2026-05-20 11:22:00',
      terminatedBy: 'ContractAdmin',
      terminatedAt: '2026-06-25 15:30:00'
    },
    {
      id: 'CT20260628-0001',
      name: '杭州中盛仓储设备采购合同',
      type: 'PURCHASE',
      counterpartyCode: 'VEND005',
      counterpartyName: '杭州中盛机械设备有限公司',
      amount: 76000,
      signDate: '2026-06-28',
      expireDate: '2026-09-30',
      status: 'DRAFT',
      scanFileName: '',
      remark: '等待对方回传盖章扫描件。',
      createdBy: 'ContractAdmin',
      createdAt: '2026-06-28 13:40:00'
    }
  ];
}

function readContracts() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialContracts();
  try {
    const list = JSON.parse(raw) as Contract[];
    return Array.isArray(list) ? list : initialContracts();
  } catch {
    return initialContracts();
  }
}

function writeContracts(list: Contract[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeContract(data: Contract): Contract {
  const parties = data.type === 'SALES' ? baseDataApi.getCustomers() : baseDataApi.getSuppliers();
  const party = parties.find(item => item.code === data.counterpartyCode);
  if (!data.name.trim()) throw new Error('合同名称必填');
  if (!party) throw new Error('请选择合同对方');
  if (data.amount <= 0) throw new Error('合同金额必须大于 0');
  if (!data.signDate) throw new Error('签订日期必填');
  if (!data.expireDate) throw new Error('到期日期必填');
  if (data.expireDate < data.signDate) throw new Error('到期日期不能早于签订日期');
  return {
    ...data,
    name: data.name.trim(),
    counterpartyName: party.name,
    amount: money(data.amount),
    scanFileName: data.scanFileName?.trim(),
    remark: data.remark?.trim()
  };
}

export const contractApi = {
  getContracts(filters: { status?: ContractStatus | 'ALL'; keyword?: string; type?: ContractType | 'ALL' } = {}): Contract[] {
    const keyword = filters.keyword?.trim().toLowerCase() || '';
    return readContracts()
      .filter(item => !filters.status || filters.status === 'ALL' || item.status === filters.status)
      .filter(item => !filters.type || filters.type === 'ALL' || item.type === filters.type)
      .filter(item => {
        if (!keyword) return true;
        return item.id.toLowerCase().includes(keyword)
          || item.name.toLowerCase().includes(keyword)
          || item.counterpartyName.toLowerCase().includes(keyword);
      })
      .sort((a, b) => b.signDate.localeCompare(a.signDate) || b.id.localeCompare(a.id));
  },

  getContractById(id: string): Contract | null {
    return readContracts().find(item => item.id === id) || null;
  },

  createDraft(type: ContractType = 'SALES'): Contract {
    const list = readContracts();
    const parties = type === 'SALES' ? baseDataApi.getCustomers() : baseDataApi.getSuppliers();
    const firstParty = parties.find(item => item.status === 'active') || parties[0];
    return {
      id: generateContractId(list),
      name: '',
      type,
      counterpartyCode: firstParty?.code || '',
      counterpartyName: firstParty?.name || '',
      amount: 0,
      signDate: today(),
      expireDate: today(),
      status: 'DRAFT',
      scanFileName: '',
      remark: '',
      createdBy: OPERATOR,
      createdAt: now()
    };
  },

  saveContract(data: Contract): Contract {
    const list = readContracts();
    const idx = list.findIndex(item => item.id === data.id);
    const next = {
      ...normalizeContract(data),
      status: data.status || 'DRAFT',
      updatedBy: OPERATOR,
      updatedAt: now()
    };
    if (idx >= 0) {
      if (list[idx].status !== 'DRAFT') throw new Error('只有草稿合同可以编辑');
      list[idx] = { ...list[idx], ...next };
    } else {
      list.unshift(next);
    }
    writeContracts(list);
    return next;
  },

  activateContract(id: string): Contract {
    const list = readContracts();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) throw new Error('合同不存在');
    if (list[idx].status !== 'DRAFT') throw new Error('只有草稿合同可以生效');
    const next = normalizeContract(list[idx]);
    list[idx] = {
      ...next,
      status: 'ACTIVE',
      activatedBy: OPERATOR,
      activatedAt: now(),
      updatedBy: OPERATOR,
      updatedAt: now()
    };
    writeContracts(list);
    return list[idx];
  },

  terminateContract(id: string): Contract {
    const list = readContracts();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) throw new Error('合同不存在');
    if (list[idx].status !== 'ACTIVE') throw new Error('只有执行中合同可以终止');
    list[idx] = {
      ...list[idx],
      status: 'TERMINATED',
      terminatedBy: OPERATOR,
      terminatedAt: now(),
      updatedBy: OPERATOR,
      updatedAt: now()
    };
    writeContracts(list);
    return list[idx];
  },

  renewContract(id: string): Contract {
    const source = this.getContractById(id);
    if (!source) throw new Error('合同不存在');
    if (source.status !== 'EXPIRED') throw new Error('只有已到期合同可以续约');
    const list = readContracts();
    const next: Contract = {
      ...source,
      id: generateContractId(list),
      name: `${source.name}（续约）`,
      status: 'DRAFT',
      signDate: today(),
      expireDate: today(),
      createdBy: OPERATOR,
      createdAt: now(),
      updatedBy: undefined,
      updatedAt: undefined,
      activatedBy: undefined,
      activatedAt: undefined,
      terminatedBy: undefined,
      terminatedAt: undefined
    };
    list.unshift(next);
    writeContracts(list);
    return next;
  },

  deleteContract(id: string) {
    const list = readContracts();
    const target = list.find(item => item.id === id);
    if (!target) throw new Error('合同不存在');
    if (target.status !== 'DRAFT') throw new Error('只有草稿合同可以删除');
    writeContracts(list.filter(item => item.id !== id));
  },

  getParties(type: ContractType) {
    return type === 'SALES' ? baseDataApi.getCustomers() : baseDataApi.getSuppliers();
  }
};
