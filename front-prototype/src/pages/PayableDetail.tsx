import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { financeApi } from '../api/finance';
import type { BaseSupplier } from '../types/baseData';
import type { PayableSource, PaymentRecord, SourceBalance } from '../types/finance';
import { SETTLEMENT_STATUS_LABELS } from '../types/finance';
import { Button } from '../components/ui/Button';

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function PayableDetail() {
  const navigate = useNavigate();
  const { supplierCode = '' } = useParams();
  const [supplier, setSupplier] = useState<BaseSupplier | null>(null);
  const [sources, setSources] = useState<PayableSource[]>([]);
  const [balances, setBalances] = useState<SourceBalance[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    const detail = financeApi.getPayableDetail(supplierCode);
    setSupplier(detail.supplier);
    setSources(detail.sources);
    setBalances(detail.balances);
    setPayments(detail.payments);
  }, [supplierCode]);

  if (!supplier) {
    return <div className="p-8 text-center text-slate-400">供应商不存在或无应付记录</div>;
  }

  const payableAmount = sources.reduce((sum, item) => sum + item.amount, 0);
  const paidAmount = payments.reduce((sum, item) => sum + item.amount, 0);
  const balance = payableAmount - paidAmount;

  return (
    <div className="space-y-4 pb-16">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/finance/payables')} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">应付明细 - {supplier.name}</h1>
            <p className="text-xs text-slate-500 mt-1">供应商编码：<span className="font-mono font-bold text-primary">{supplier.code}</span></p>
          </div>
        </div>
        {balance > 0 && (
          <Button size="sm" onClick={() => navigate(`/finance/payments/new?supplierCode=${supplier.code}`)} className="gap-1.5 font-bold">
            <PlusCircle size={14} />
            付款
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard label="联系人" value={supplier.contact} />
        <InfoCard label="账期" value={`${supplier.paymentPeriod} 天`} />
        <InfoCard label="应付金额" value={money(payableAmount)} tone="text-slate-800" />
        <InfoCard label="余额" value={money(balance)} tone="text-rose-600" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">应付明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="p-3">来源单号 PI</th>
                <th className="p-3 text-right">金额</th>
                <th className="p-3 text-right">已付</th>
                <th className="p-3 text-right">余额</th>
                <th className="p-3">日期</th>
                <th className="p-3">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balances.map(row => (
                <tr key={row.sourceNo}>
                  <td className="p-3 font-mono font-bold text-primary">{row.sourceNo}</td>
                  <td className="p-3 text-right font-bold">{money(row.amount)}</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">{money(row.settledAmount)}</td>
                  <td className="p-3 text-right text-rose-600 font-bold">{money(row.balance)}</td>
                  <td className="p-3 text-slate-500">{row.sourceDate}</td>
                  <td className="p-3 font-bold text-slate-600">{SETTLEMENT_STATUS_LABELS[row.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">付款记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="p-3">付款单 PY</th>
                <th className="p-3">核销 PI</th>
                <th className="p-3 text-right">付款金额</th>
                <th className="p-3">付款日期</th>
                <th className="p-3">操作人</th>
                <th className="p-3">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(row => (
                <tr key={row.id}>
                  <td className="p-3 font-mono font-bold text-emerald-600">{row.id}</td>
                  <td className="p-3 font-mono">{row.sourceNo}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{money(row.amount)}</td>
                  <td className="p-3 text-slate-500">{row.paymentDate}</td>
                  <td className="p-3">{row.operator}</td>
                  <td className="p-3 text-slate-500">{row.remark || '-'}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">暂无付款记录</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, tone = 'text-slate-700' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className={`text-lg font-extrabold mt-1 ${tone}`}>{value}</div>
    </div>
  );
}
