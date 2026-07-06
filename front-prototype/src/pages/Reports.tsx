import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, PackageCheck, ReceiptText, ShoppingCart, TrendingUp, WalletCards } from 'lucide-react';
import { salesApi } from '../api/sales';
import { purchaseOrderApi } from '../api/purchaseOrder';
import { stockInApi } from '../api/stockIn';
import { baseDataApi } from '../api/baseData';
import { readTable, type AccountPayable, type AccountReceivable } from '../db';
import type { SalesOutbound } from '../types/sales';
import type { RetailOrder } from '../types/retail';

type RankedItem = {
  label: string;
  value: number;
  subLabel?: string;
};

type SalesMetric = {
  label: string;
  amount: number;
  growth: number;
};

const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0
});

const moneyPrecise = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function parseDate(value: string): Date {
  return new Date(`${value.split(' ')[0]}T00:00:00`);
}

function dateOnly(value: string): string {
  return value.split(' ')[0];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function safeGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function sumBy<T>(rows: T[], getter: (row: T) => number): number {
  return rows.reduce((sum, row) => sum + getter(row), 0);
}

function groupRank<T>(
  rows: T[],
  keyGetter: (row: T) => string,
  valueGetter: (row: T) => number,
  subGetter?: (row: T) => string
): RankedItem[] {
  const grouped = new Map<string, RankedItem>();
  rows.forEach(row => {
    const key = keyGetter(row);
    const current = grouped.get(key) || { label: key, value: 0, subLabel: subGetter?.(row) };
    current.value += valueGetter(row);
    grouped.set(key, current);
  });
  return Array.from(grouped.values()).sort((a, b) => b.value - a.value).slice(0, 5);
}

function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function useReportData() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion(x => x + 1);
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return useMemo(() => {
    const salesOutbounds = salesApi.getSalesOutbounds({ status: 'CONFIRMED' });
    const salesOrders = salesApi.getSalesOrders();
    const retailOrders = readTable<RetailOrder>('retailOrders', []);
    const purchaseOrders = purchaseOrderApi.getOrders();
    const stockIns = stockInApi.getStockIns();
    const stocks = stockInApi.getInstantStocks();
    const suppliers = baseDataApi.getSuppliers();
    const customers = baseDataApi.getCustomers();
    const payables = readTable<AccountPayable>('accountsPayable', []);
    const receivables = readTable<AccountReceivable>('accountsReceivable', []);

    const salesRows = [
      ...salesOutbounds.map(row => ({
        date: row.outboundDate,
        customerName: row.customerName,
        amount: row.totalAmount,
        items: row.items
      })),
      ...retailOrders.map(row => ({
        date: dateOnly(row.checkoutAt),
        customerName: '零售散客',
        amount: row.paidAmount,
        items: row.items
      }))
    ];

    const salesDates = salesRows.map(row => row.date).sort();
    const reportDate = salesDates.length > 0 ? parseDate(salesDates[salesDates.length - 1]) : new Date();
    const today = formatDate(reportDate);
    const weekStart = startOfWeek(reportDate);
    const weekEnd = addDays(weekStart, 6);
    const monthPrefix = today.slice(0, 7);

    const amountInRange = (start: Date, end: Date) => sumBy(salesRows, row => {
      const d = parseDate(row.date);
      return d >= start && d <= end ? row.amount : 0;
    });

    const todayAmount = sumBy(salesRows.filter(row => row.date === today), row => row.amount);
    const yesterday = formatDate(addDays(reportDate, -1));
    const yesterdayAmount = sumBy(salesRows.filter(row => row.date === yesterday), row => row.amount);
    const thisWeekAmount = amountInRange(weekStart, weekEnd);
    const prevWeekAmount = amountInRange(addDays(weekStart, -7), addDays(weekEnd, -7));
    const thisMonthAmount = sumBy(salesRows.filter(row => row.date.startsWith(monthPrefix)), row => row.amount);
    const previousMonth = new Date(reportDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousMonthPrefix = formatDate(previousMonth).slice(0, 7);
    const previousMonthAmount = sumBy(salesRows.filter(row => row.date.startsWith(previousMonthPrefix)), row => row.amount);

    const salesMetrics: SalesMetric[] = [
      { label: '今日销售额', amount: todayAmount, growth: safeGrowth(todayAmount, yesterdayAmount) },
      { label: '本周销售额', amount: thisWeekAmount, growth: safeGrowth(thisWeekAmount, prevWeekAmount) },
      { label: '本月销售额', amount: thisMonthAmount, growth: safeGrowth(thisMonthAmount, previousMonthAmount) }
    ];

    const productSales = groupRank(
      salesRows.flatMap(row => row.items.map(item => ({ ...item, rowAmount: item.amount }))),
      item => item.productName,
      item => item.rowAmount,
      item => item.productCode
    );
    const customerSales = groupRank(salesRows, row => row.customerName, row => row.amount);

    const monthlyPurchaseOrders = purchaseOrders.filter(po => po.orderDate.startsWith(monthPrefix));
    const monthPurchaseAmount = sumBy(monthlyPurchaseOrders, po => po.totalAmount);
    const pendingPurchaseAmount = sumBy(purchaseOrders, po => {
      if (po.status !== 'PENDING_STOCK_IN' && po.status !== 'PARTIAL_STOCK_IN') return 0;
      return sumBy(po.items, item => item.pendingQuantity * item.price);
    });
    const supplierPurchase = groupRank(
      purchaseOrders,
      po => po.supplierName,
      po => po.totalAmount,
      po => po.supplierCode
    );

    const totalSku = new Set(stocks.map(stock => stock.productCode)).size;
    const lowSafetySku = stocks.filter(stock => {
      if (stock.safetyStock === '-') return false;
      return stock.available < stock.safetyStock;
    }).length;
    const warehouseStock = groupRank(stocks, stock => stock.warehouseName, stock => Math.max(0, stock.quantity), stock => stock.warehouseCode);

    const receivableRows = receivables.length > 0
      ? receivables
      : salesOutbounds.map((outbound: SalesOutbound) => ({
        id: `DERIVED-${outbound.id}`,
        salesOutboundId: outbound.id,
        customerName: outbound.customerName,
        amount: outbound.totalAmount,
        status: 'UNPAID',
        createdAt: outbound.confirmedAt || `${outbound.outboundDate} 00:00:00`
      }));
    const payableRows = payables.length > 0
      ? payables
      : stockIns
        .filter(stockIn => stockIn.status === 'CONFIRMED')
        .map(stockIn => ({
          id: `DERIVED-${stockIn.id}`,
          stockInId: stockIn.id,
          supplierName: stockIn.supplierName,
          amount: stockIn.totalAmount,
          status: 'UNPAID',
          createdAt: stockIn.confirmedAt || `${stockIn.stockInDate} 00:00:00`
        }));

    const receivableAmount = sumBy(receivableRows, row => row.amount);
    const payableAmount = sumBy(payableRows, row => row.amount);
    const netAmount = receivableAmount - payableAmount;

    const customerMap = new Map(customers.map(customer => [customer.name, customer]));
    const overdueCustomers = groupRank(
      receivableRows.filter(row => {
        const customer = customerMap.get(row.customerName);
        const period = customer?.paymentPeriod ?? 30;
        const dueDate = addDays(parseDate(row.createdAt), period);
        return row.status !== 'PAID' && dueDate < reportDate;
      }),
      row => row.customerName,
      row => row.amount,
      row => {
        const customer = customerMap.get(row.customerName);
        const period = customer?.paymentPeriod ?? 30;
        const overdueDays = Math.max(1, Math.ceil((reportDate.getTime() - addDays(parseDate(row.createdAt), period).getTime()) / 86400000));
        return `超期 ${overdueDays} 天`;
      }
    );

    return {
      reportDate: today,
      salesMetrics,
      productSales,
      customerSales,
      monthPurchaseAmount,
      pendingPurchaseAmount,
      supplierPurchase,
      totalSku,
      lowSafetySku,
      warehouseStock,
      receivableAmount,
      payableAmount,
      netAmount,
      overdueCustomers,
      supplierCount: suppliers.length
    };
  }, [version]);
}

export default function Reports() {
  const data = useReportData();

  return (
    <div className="space-y-5 pb-12 text-xs">
      <div className="flex flex-col gap-2 bg-white p-5 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-black text-slate-800">报表中心</h1>
            <p className="text-xs text-slate-500 mt-1">数据截止日 {data.reportDate}，从本地业务数据表聚合生成。</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 font-bold">
            <Activity size={14} className="text-primary" />
            自动刷新
          </div>
        </div>
      </div>

      <section className="bg-white rounded-lg shadow-sm border border-slate-100 p-5 space-y-5">
        <SectionTitle icon={<TrendingUp size={17} />} title="销售概览" tone="text-blue-600" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.salesMetrics.map(metric => (
            <MetricCard key={metric.label} label={metric.label} amount={metric.amount} growth={metric.growth} />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <BarPanel title="TOP5 畅销商品" rows={data.productSales} color="bg-blue-500" valueFormatter={moneyPrecise.format} />
          <RankTable title="按客户销售排行" rows={data.customerSales} valueLabel="销售额" />
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-slate-100 p-5 space-y-5">
        <SectionTitle icon={<ShoppingCart size={17} />} title="采购概览" tone="text-emerald-600" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PlainAmount label="本月采购总额" amount={data.monthPurchaseAmount} tone="text-slate-800" />
          <PlainAmount label="待入库金额" amount={data.pendingPurchaseAmount} tone="text-orange-600" />
        </div>
        <BarPanel title="TOP5 供应商采购额" rows={data.supplierPurchase} color="bg-emerald-500" valueFormatter={moneyPrecise.format} />
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-slate-100 p-5 space-y-5">
        <SectionTitle icon={<PackageCheck size={17} />} title="库存概览" tone="text-indigo-600" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-5 flex items-center gap-5">
            <RingProgress value={data.lowSafetySku} total={data.totalSku} />
            <div>
              <p className="text-slate-400 font-bold">总 SKU 数 / 低于安全库存数</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800">{data.totalSku}</span>
                <span className="text-slate-300 font-bold">/</span>
                <span className="text-3xl font-black text-rose-600">{data.lowSafetySku}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">安全库存口径使用即时库存表的可用量与安全库存量。</p>
            </div>
          </div>
          <div className="xl:col-span-2">
            <BarPanel title="各仓库库存分布" rows={data.warehouseStock} color="bg-indigo-500" valueFormatter={value => `${value.toLocaleString('zh-CN')} 件`} />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-slate-100 p-5 space-y-5">
        <SectionTitle icon={<WalletCards size={17} />} title="往来概览" tone="text-rose-600" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PlainAmount label="应收总额" amount={data.receivableAmount} tone="text-blue-600" />
          <PlainAmount label="应付总额" amount={data.payableAmount} tone="text-orange-600" />
          <PlainAmount label="净额" amount={data.netAmount} tone={data.netAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        </div>
        <div className="rounded-lg border border-rose-100 overflow-hidden">
          <div className="px-4 py-3 bg-rose-50/70 border-b border-rose-100 flex items-center gap-2 font-black text-rose-700">
            <ReceiptText size={15} />
            超期未收 TOP5 客户
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-slate-500">
                <th className="p-3 w-14 text-center">#</th>
                <th className="p-3">客户</th>
                <th className="p-3">超期</th>
                <th className="p-3 text-right">未收金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.overdueCustomers.map((row, index) => (
                <tr key={row.label} className="bg-rose-50/40 text-rose-700 font-bold">
                  <td className="p-3 text-center">{index + 1}</td>
                  <td className="p-3">{row.label}</td>
                  <td className="p-3">{row.subLabel || '超期'}</td>
                  <td className="p-3 text-right">{moneyPrecise.format(row.value)}</td>
                </tr>
              ))}
              {data.overdueCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-slate-400 font-semibold">暂无超期未收客户</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon, title, tone }: { icon: React.ReactNode; title: string; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`${tone} bg-slate-50 border border-slate-100 p-1.5 rounded-md`}>{icon}</span>
      <h2 className="text-sm font-black text-slate-800">{title}</h2>
    </div>
  );
}

function MetricCard({ label, amount, growth }: SalesMetric) {
  const positive = growth >= 0;
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/40 p-4">
      <p className="font-bold text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-2xl font-black text-slate-800">{money.format(amount)}</span>
        <span className={`text-xs font-black ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {positive ? '+' : ''}{growth}%
        </span>
      </div>
    </div>
  );
}

function PlainAmount({ label, amount, tone }: { label: string; amount: number; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/40 p-4">
      <p className="font-bold text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-black ${tone}`}>{moneyPrecise.format(amount)}</p>
    </div>
  );
}

function BarPanel({
  title,
  rows,
  color,
  valueFormatter
}: {
  title: string;
  rows: RankedItem[];
  color: string;
  valueFormatter: (value: number) => string;
}) {
  const maxValue = Math.max(...rows.map(row => row.value), 0);
  return (
    <div className="rounded-lg border border-slate-100 p-4">
      <h3 className="font-black text-slate-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.label} className="grid grid-cols-[150px_1fr_100px] gap-3 items-center">
            <div className="min-w-0">
              <p className="font-bold text-slate-700 truncate">{row.label}</p>
              {row.subLabel && <p className="text-[10px] text-slate-400 truncate">{row.subLabel}</p>}
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${percent(row.value, maxValue)}%` }} />
            </div>
            <div className="text-right font-black text-slate-700">{valueFormatter(row.value)}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="p-6 text-center text-slate-400 font-semibold">暂无数据</div>}
      </div>
    </div>
  );
}

function RankTable({ title, rows, valueLabel }: { title: string; rows: RankedItem[]; valueLabel: string }) {
  return (
    <div className="rounded-lg border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-black text-slate-700">{title}</div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 text-slate-500">
            <th className="p-3 w-14 text-center">#</th>
            <th className="p-3">客户</th>
            <th className="p-3 text-right">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.label} className="hover:bg-slate-50/60">
              <td className="p-3 text-center text-slate-400 font-bold">{index + 1}</td>
              <td className="p-3 font-bold text-slate-700">{row.label}</td>
              <td className="p-3 text-right font-black text-slate-800">{moneyPrecise.format(row.value)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-slate-400 font-semibold">暂无数据</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function RingProgress({ value, total }: { value: number; total: number }) {
  const ratio = percent(value, total);
  return (
    <div
      className="w-28 h-28 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `conic-gradient(#e11d48 ${ratio * 3.6}deg, #e2e8f0 0deg)` }}
    >
      <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center border border-slate-100">
        <span className="text-lg font-black text-rose-600">{ratio}%</span>
        <span className="text-[10px] text-slate-400 font-bold">预警占比</span>
      </div>
    </div>
  );
}
