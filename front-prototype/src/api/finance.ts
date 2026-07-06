import { baseDataApi } from './baseData';
import { readTable, replaceTable, type AccountPayable, type AccountReceivable } from '../db';
import type {
  PayableSource,
  PayableSummary,
  PaymentRecord,
  ReceiptRecord,
  ReceivableSource,
  ReceivableSummary,
  SettlementStatus,
  SourceBalance,
} from '../types/finance';

function nowDate() {
  return new Date().toISOString().split('T')[0];
}

function nowDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function compactToday() {
  return new Date().toISOString().split('T')[0].replace(/-/g, '');
}

function money(value: number) {
  return parseFloat(value.toFixed(2));
}

function statusOf(total: number, settled: number): SettlementStatus {
  if (settled <= 0) return 'UNSETTLED';
  if (money(settled) >= money(total)) return 'SETTLED';
  return 'PARTIAL';
}

function nextId(prefix: 'RC' | 'PY', existingIds: string[]) {
  const head = `${prefix}${compactToday()}`;
  const next = existingIds.filter(id => id.startsWith(head)).length + 1;
  return `${head}-${String(next).padStart(4, '0')}`;
}

function initialReceivables(): AccountReceivable[] {
  return [
    { id: 'AR20260618-0001', salesOutboundId: 'SOO20260618-0001', sourceNo: 'SOO20260618-0001', customerCode: 'CUST001', customerName: '北京晨光文具加盟店', amount: 500.00, status: 'UNSETTLED', createdAt: '2026-06-18 10:25:00', sourceDate: '2026-06-18' },
    { id: 'AR20260625-0001', salesOutboundId: 'SOO20260625-0001', sourceNo: 'SOO20260625-0001', customerCode: 'CUST004', customerName: '深圳卓越办公设备行', amount: 615.60, status: 'UNSETTLED', createdAt: '2026-06-26 09:25:00', sourceDate: '2026-06-26' },
    { id: 'AR20260701-0001', salesOutboundId: 'SOO20260701-0001', sourceNo: 'SOO20260701-0001', customerCode: 'CUST002', customerName: '上海好德便利店连锁', amount: 420.00, status: 'UNSETTLED', createdAt: '2026-07-01 11:00:00', sourceDate: '2026-07-01' },
    { id: 'AR20260702-0001', salesOutboundId: 'SOO20260702-0001', sourceNo: 'SOO20260702-0001', customerCode: 'CUST003', customerName: '广州大学城红叶书店', amount: 360.00, status: 'UNSETTLED', createdAt: '2026-07-02 15:10:00', sourceDate: '2026-07-02' },
    { id: 'AR20260703-0001', salesOutboundId: 'SOO20260703-0001', sourceNo: 'SOO20260703-0001', customerCode: 'CUST001', customerName: '北京晨光文具加盟店', amount: 1280.00, status: 'UNSETTLED', createdAt: '2026-07-03 09:40:00', sourceDate: '2026-07-03' },
    { id: 'AR20260704-0001', salesOutboundId: 'SOO20260704-0001', sourceNo: 'SOO20260704-0001', customerCode: 'CUST003', customerName: '广州大学城红叶书店', amount: 885.00, status: 'UNSETTLED', createdAt: '2026-07-04 15:10:00', sourceDate: '2026-07-04' },
    { id: 'AR20260704-0002', salesOutboundId: 'SOO20260704-0002', sourceNo: 'SOO20260704-0002', customerCode: 'CUST004', customerName: '深圳卓越办公设备行', amount: 1460.00, status: 'UNSETTLED', createdAt: '2026-07-04 16:05:00', sourceDate: '2026-07-04' },
    { id: 'AR20260705-0001', salesOutboundId: 'SOO20260705-0001', sourceNo: 'SOO20260705-0001', customerCode: 'CUST002', customerName: '上海好德便利店连锁', amount: 760.00, status: 'UNSETTLED', createdAt: '2026-07-05 10:20:00', sourceDate: '2026-07-05' },
  ];
}

function initialPayables(): AccountPayable[] {
  return [
    { id: 'AP20260615-0001', stockInId: 'PI20260615-0001', sourceNo: 'PI20260615-0001', supplierCode: 'VEND001', supplierName: '北京强盛贸易有限公司', amount: 1105.00, status: 'UNPAID', createdAt: '2026-06-15 11:50:00', sourceDate: '2026-06-15' },
    { id: 'AP20260620-0001', stockInId: 'PI20260620-0001', sourceNo: 'PI20260620-0001', supplierCode: 'VEND002', supplierName: '上海腾飞电子器材厂', amount: 817.50, status: 'UNPAID', createdAt: '2026-06-20 15:50:00', sourceDate: '2026-06-20' },
    { id: 'AP20260702-0001', stockInId: 'PI20260704-0004', sourceNo: 'PI20260704-0004', supplierCode: 'VEND003', supplierName: '广州力行包装材料公司', amount: 180.00, status: 'UNPAID', createdAt: '2026-07-02 14:20:00', sourceDate: '2026-07-02' },
    { id: 'AP20260704-0001', stockInId: 'PI20260704-0005', sourceNo: 'PI20260704-0005', supplierCode: 'VEND001', supplierName: '北京强盛贸易有限公司', amount: 125.00, status: 'UNPAID', createdAt: '2026-07-04 09:50:00', sourceDate: '2026-07-04' },
    { id: 'AP20260704-0002', stockInId: 'PI20260704-0006', sourceNo: 'PI20260704-0006', supplierCode: 'VEND005', supplierName: '杭州中盛机械设备有限公司', amount: 640.00, status: 'UNPAID', createdAt: '2026-07-04 13:00:00', sourceDate: '2026-07-04' },
    { id: 'AP20260705-0001', stockInId: 'PI20260705-0001', sourceNo: 'PI20260705-0001', supplierCode: 'VEND002', supplierName: '上海腾飞电子器材厂', amount: 450.00, status: 'UNPAID', createdAt: '2026-07-05 10:10:00', sourceDate: '2026-07-05' },
    { id: 'AP20260705-0002', stockInId: 'PI20260705-0002', sourceNo: 'PI20260705-0002', supplierCode: 'VEND003', supplierName: '广州力行包装材料公司', amount: 360.00, status: 'UNPAID', createdAt: '2026-07-05 14:30:00', sourceDate: '2026-07-05' },
    { id: 'AP20260706-0001', stockInId: 'PI20260706-0001', sourceNo: 'PI20260706-0001', supplierCode: 'VEND005', supplierName: '杭州中盛机械设备有限公司', amount: 960.00, status: 'UNPAID', createdAt: '2026-07-06 09:30:00', sourceDate: '2026-07-06' },
  ];
}

function initialReceipts(): ReceiptRecord[] {
  return [
    { id: 'RC20260620-0001', customerCode: 'CUST001', customerName: '北京晨光文具加盟店', sourceNo: 'SOO20260618-0001', amount: 500.00, receiptDate: '2026-06-20', operator: 'Cashier01', remark: '银行转账' },
    { id: 'RC20260701-0001', customerCode: 'CUST004', customerName: '深圳卓越办公设备行', sourceNo: 'SOO20260625-0001', amount: 300.00, receiptDate: '2026-07-01', operator: 'Cashier01', remark: '部分收款' },
    { id: 'RC20260702-0001', customerCode: 'CUST002', customerName: '上海好德便利店连锁', sourceNo: 'SOO20260701-0001', amount: 420.00, receiptDate: '2026-07-02', operator: 'Cashier02', remark: '现结客户收讫' },
    { id: 'RC20260703-0001', customerCode: 'CUST001', customerName: '北京晨光文具加盟店', sourceNo: 'SOO20260703-0001', amount: 400.00, receiptDate: '2026-07-03', operator: 'Cashier01', remark: '先收定金' },
    { id: 'RC20260704-0001', customerCode: 'CUST003', customerName: '广州大学城红叶书店', sourceNo: 'SOO20260704-0001', amount: 300.00, receiptDate: '2026-07-04', operator: 'Cashier02', remark: '校园客户部分回款' },
    { id: 'RC20260705-0001', customerCode: 'CUST004', customerName: '深圳卓越办公设备行', sourceNo: 'SOO20260704-0002', amount: 760.00, receiptDate: '2026-07-05', operator: 'Cashier01', remark: '月结回款' },
    { id: 'RC20260705-0002', customerCode: 'CUST002', customerName: '上海好德便利店连锁', sourceNo: 'SOO20260705-0001', amount: 200.00, receiptDate: '2026-07-05', operator: 'Cashier02', remark: '部分核销' },
    { id: 'RC20260706-0001', customerCode: 'CUST001', customerName: '北京晨光文具加盟店', sourceNo: 'SOO20260703-0001', amount: 380.00, receiptDate: '2026-07-06', operator: 'Cashier01', remark: '第二笔回款' },
  ];
}

function initialPayments(): PaymentRecord[] {
  return [
    { id: 'PY20260618-0001', supplierCode: 'VEND001', supplierName: '北京强盛贸易有限公司', sourceNo: 'PI20260615-0001', amount: 600.00, paymentDate: '2026-06-18', operator: 'Finance01', remark: '首付款' },
    { id: 'PY20260621-0001', supplierCode: 'VEND002', supplierName: '上海腾飞电子器材厂', sourceNo: 'PI20260620-0001', amount: 817.50, paymentDate: '2026-06-21', operator: 'Finance01', remark: '现结已付清' },
    { id: 'PY20260703-0001', supplierCode: 'VEND003', supplierName: '广州力行包装材料公司', sourceNo: 'PI20260704-0004', amount: 90.00, paymentDate: '2026-07-03', operator: 'Finance02', remark: '部分付款' },
    { id: 'PY20260704-0001', supplierCode: 'VEND001', supplierName: '北京强盛贸易有限公司', sourceNo: 'PI20260704-0005', amount: 125.00, paymentDate: '2026-07-04', operator: 'Finance01', remark: '小额付清' },
    { id: 'PY20260704-0002', supplierCode: 'VEND005', supplierName: '杭州中盛机械设备有限公司', sourceNo: 'PI20260704-0006', amount: 200.00, paymentDate: '2026-07-04', operator: 'Finance02', remark: '设备预付款' },
    { id: 'PY20260705-0001', supplierCode: 'VEND002', supplierName: '上海腾飞电子器材厂', sourceNo: 'PI20260705-0001', amount: 150.00, paymentDate: '2026-07-05', operator: 'Finance01', remark: '部分付款' },
    { id: 'PY20260705-0002', supplierCode: 'VEND003', supplierName: '广州力行包装材料公司', sourceNo: 'PI20260705-0002', amount: 360.00, paymentDate: '2026-07-05', operator: 'Finance02', remark: '付清' },
    { id: 'PY20260706-0001', supplierCode: 'VEND005', supplierName: '杭州中盛机械设备有限公司', sourceNo: 'PI20260706-0001', amount: 300.00, paymentDate: '2026-07-06', operator: 'Finance01', remark: '设备尾款部分支付' },
  ];
}

function getReceivableSources(): ReceivableSource[] {
  return readTable<AccountReceivable>('accountsReceivable', initialReceivables()).map(row => ({
    id: row.id,
    sourceNo: row.sourceNo || row.salesOutboundId || row.retailOrderId || row.id,
    customerCode: row.customerCode || '',
    customerName: row.customerName,
    amount: row.amount,
    sourceDate: row.sourceDate || row.createdAt.split(' ')[0],
    remark: row.status,
  }));
}

function getPayableSources(): PayableSource[] {
  return readTable<AccountPayable>('accountsPayable', initialPayables()).map(row => ({
    id: row.id,
    sourceNo: row.sourceNo || row.stockInId || row.id,
    supplierCode: row.supplierCode || '',
    supplierName: row.supplierName,
    amount: row.amount,
    sourceDate: row.sourceDate || row.createdAt.split(' ')[0],
    remark: row.status,
  }));
}

function getReceipts(): ReceiptRecord[] {
  return readTable('receiptRecords', initialReceipts());
}

function getPayments(): PaymentRecord[] {
  return readTable('paymentRecords', initialPayments());
}

function saveReceipts(records: ReceiptRecord[]) {
  replaceTable('receiptRecords', records);
}

function savePayments(records: PaymentRecord[]) {
  replaceTable('paymentRecords', records);
}

function sourceBalance(source: ReceivableSource, receipts: ReceiptRecord[]): SourceBalance {
  const settledAmount = money(receipts.filter(r => r.sourceNo === source.sourceNo).reduce((sum, r) => sum + r.amount, 0));
  const balance = money(source.amount - settledAmount);
  return {
    sourceNo: source.sourceNo,
    partnerCode: source.customerCode,
    partnerName: source.customerName,
    amount: source.amount,
    settledAmount,
    balance,
    sourceDate: source.sourceDate,
    status: statusOf(source.amount, settledAmount),
  };
}

function payableBalance(source: PayableSource, payments: PaymentRecord[]): SourceBalance {
  const settledAmount = money(payments.filter(r => r.sourceNo === source.sourceNo).reduce((sum, r) => sum + r.amount, 0));
  const balance = money(source.amount - settledAmount);
  return {
    sourceNo: source.sourceNo,
    partnerCode: source.supplierCode,
    partnerName: source.supplierName,
    amount: source.amount,
    settledAmount,
    balance,
    sourceDate: source.sourceDate,
    status: statusOf(source.amount, settledAmount),
  };
}

export const financeApi = {
  getCustomers() {
    return baseDataApi.getCustomers().filter(item => item.status === 'active');
  },

  getSuppliers() {
    return baseDataApi.getSuppliers().filter(item => item.status === 'active');
  },

  getReceivableSummaries(status: SettlementStatus | 'ALL' = 'ALL'): ReceivableSummary[] {
    const sources = getReceivableSources();
    const receipts = getReceipts();
    const map = new Map<string, ReceivableSummary>();

    for (const source of sources) {
      const settled = receipts.filter(r => r.sourceNo === source.sourceNo).reduce((sum, r) => sum + r.amount, 0);
      const current = map.get(source.customerCode) || {
        customerCode: source.customerCode,
        customerName: source.customerName,
        receivableAmount: 0,
        receivedAmount: 0,
        balance: 0,
        lastTransactionDate: source.sourceDate,
        status: 'UNSETTLED' as SettlementStatus,
      };
      current.receivableAmount = money(current.receivableAmount + source.amount);
      current.receivedAmount = money(current.receivedAmount + settled);
      current.balance = money(current.receivableAmount - current.receivedAmount);
      current.lastTransactionDate = [current.lastTransactionDate, source.sourceDate, ...receipts.filter(r => r.sourceNo === source.sourceNo).map(r => r.receiptDate)].sort().at(-1) || source.sourceDate;
      current.status = statusOf(current.receivableAmount, current.receivedAmount);
      map.set(source.customerCode, current);
    }

    return Array.from(map.values())
      .filter(item => status === 'ALL' || item.status === status)
      .sort((a, b) => b.lastTransactionDate.localeCompare(a.lastTransactionDate));
  },

  getPayableSummaries(status: SettlementStatus | 'ALL' = 'ALL'): PayableSummary[] {
    const sources = getPayableSources();
    const payments = getPayments();
    const map = new Map<string, PayableSummary>();

    for (const source of sources) {
      const settled = payments.filter(r => r.sourceNo === source.sourceNo).reduce((sum, r) => sum + r.amount, 0);
      const current = map.get(source.supplierCode) || {
        supplierCode: source.supplierCode,
        supplierName: source.supplierName,
        payableAmount: 0,
        paidAmount: 0,
        balance: 0,
        lastTransactionDate: source.sourceDate,
        status: 'UNSETTLED' as SettlementStatus,
      };
      current.payableAmount = money(current.payableAmount + source.amount);
      current.paidAmount = money(current.paidAmount + settled);
      current.balance = money(current.payableAmount - current.paidAmount);
      current.lastTransactionDate = [current.lastTransactionDate, source.sourceDate, ...payments.filter(r => r.sourceNo === source.sourceNo).map(r => r.paymentDate)].sort().at(-1) || source.sourceDate;
      current.status = statusOf(current.payableAmount, current.paidAmount);
      map.set(source.supplierCode, current);
    }

    return Array.from(map.values())
      .filter(item => status === 'ALL' || item.status === status)
      .sort((a, b) => b.lastTransactionDate.localeCompare(a.lastTransactionDate));
  },

  getReceivableDetail(customerCode: string) {
    const sources = getReceivableSources().filter(item => item.customerCode === customerCode);
    const receipts = getReceipts().filter(item => item.customerCode === customerCode);
    return {
      customer: baseDataApi.getCustomerByCode(customerCode),
      sources,
      balances: sources.map(source => sourceBalance(source, receipts)),
      receipts: receipts.sort((a, b) => b.receiptDate.localeCompare(a.receiptDate)),
    };
  },

  getPayableDetail(supplierCode: string) {
    const sources = getPayableSources().filter(item => item.supplierCode === supplierCode);
    const payments = getPayments().filter(item => item.supplierCode === supplierCode);
    return {
      supplier: baseDataApi.getSupplierByCode(supplierCode),
      sources,
      balances: sources.map(source => payableBalance(source, payments)),
      payments: payments.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    };
  },

  getOpenReceivableSources(customerCode: string): SourceBalance[] {
    const receipts = getReceipts();
    return getReceivableSources()
      .filter(item => item.customerCode === customerCode)
      .map(item => sourceBalance(item, receipts))
      .filter(item => item.balance > 0)
      .sort((a, b) => a.sourceDate.localeCompare(b.sourceDate));
  },

  getOpenPayableSources(supplierCode: string): SourceBalance[] {
    const payments = getPayments();
    return getPayableSources()
      .filter(item => item.supplierCode === supplierCode)
      .map(item => payableBalance(item, payments))
      .filter(item => item.balance > 0)
      .sort((a, b) => a.sourceDate.localeCompare(b.sourceDate));
  },

  getReceiptRecords(customerCode?: string): ReceiptRecord[] {
    let list = getReceipts();
    if (customerCode) list = list.filter(item => item.customerCode === customerCode);
    return list.sort((a, b) => b.receiptDate.localeCompare(a.receiptDate));
  },

  getPaymentRecords(supplierCode?: string): PaymentRecord[] {
    let list = getPayments();
    if (supplierCode) list = list.filter(item => item.supplierCode === supplierCode);
    return list.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  },

  createReceipt(data: { customerCode: string; sourceNo: string; amount: number; receiptDate?: string; remark?: string }): ReceiptRecord {
    const customer = baseDataApi.getCustomerByCode(data.customerCode);
    if (!customer) throw new Error('客户不存在');
    const source = this.getOpenReceivableSources(data.customerCode).find(item => item.sourceNo === data.sourceNo);
    if (!source) throw new Error('未找到可核销的 SOO 应收单');
    if (data.amount <= 0) throw new Error('收款金额必须大于 0');
    if (data.amount > source.balance) throw new Error(`核销金额不能大于未核销余额 ${source.balance.toFixed(2)}`);

    const records = getReceipts();
    const record: ReceiptRecord = {
      id: nextId('RC', records.map(item => item.id)),
      customerCode: customer.code,
      customerName: customer.name,
      sourceNo: data.sourceNo,
      amount: money(data.amount),
      receiptDate: data.receiptDate || nowDate(),
      operator: 'Cashier01',
      remark: data.remark || `核销 ${data.sourceNo}`,
    };
    records.unshift(record);
    saveReceipts(records);
    return record;
  },

  createPayment(data: { supplierCode: string; sourceNo: string; amount: number; paymentDate?: string; remark?: string }): PaymentRecord {
    const supplier = baseDataApi.getSupplierByCode(data.supplierCode);
    if (!supplier) throw new Error('供应商不存在');
    const source = this.getOpenPayableSources(data.supplierCode).find(item => item.sourceNo === data.sourceNo);
    if (!source) throw new Error('未找到可核销的 PI 应付单');
    if (data.amount <= 0) throw new Error('付款金额必须大于 0');
    if (data.amount > source.balance) throw new Error(`核销金额不能大于未核销余额 ${source.balance.toFixed(2)}`);

    const records = getPayments();
    const record: PaymentRecord = {
      id: nextId('PY', records.map(item => item.id)),
      supplierCode: supplier.code,
      supplierName: supplier.name,
      sourceNo: data.sourceNo,
      amount: money(data.amount),
      paymentDate: data.paymentDate || nowDate(),
      operator: 'Finance01',
      remark: data.remark || `核销 ${data.sourceNo}`,
    };
    records.unshift(record);
    savePayments(records);
    return record;
  },

  getCurrentDateTime: nowDateTime,
};
