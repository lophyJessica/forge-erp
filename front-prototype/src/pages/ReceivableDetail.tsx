import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { financeApi } from '../api/finance';
import type { BaseCustomer } from '../types/baseData';
import type { ReceiptRecord, ReceivableSource, SourceBalance } from '../types/finance';
import { SETTLEMENT_STATUS_LABELS } from '../types/finance';
import { Button } from '../components/ui/Button';

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function ReceivableDetail() {
  const navigate = useNavigate();
  const { customerCode = '' } = useParams();
  const [customer, setCustomer] = useState<BaseCustomer | null>(null);
  const [sources, setSources] = useState<ReceivableSource[]>([]);
  const [balances, setBalances] = useState<SourceBalance[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);

  useEffect(() => {
    const detail = financeApi.getReceivableDetail(customerCode);
    setCustomer(detail.customer);
    setSources(detail.sources);
    setBalances(detail.balances);
    setReceipts(detail.receipts);
  }, [customerCode]);

  if (!customer) {
    return <div className="p-8 text-center text-slate-400">客户不存在或无应收记录</div>;
  }

  const receivableAmount = sources.reduce((sum, item) => sum + item.amount, 0);
  const receivedAmount = receipts.reduce((sum, item) => sum + item.amount, 0);
  const balance = receivableAmount - receivedAmount;

  return (
    <div className="space-y-4 pb-16">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/finance/receivables')} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">应收明细 - {customer.name}</h1>
            <p className="text-xs text-slate-500 mt-1">客户编码：<span className="font-mono font-bold text-primary">{customer.code}</span></p>
          </div>
        </div>
        {balance > 0 && (
          <Button size="sm" onClick={() => navigate(`/finance/receipts/new?customerCode=${customer.code}`)} className="gap-1.5 font-bold">
            <PlusCircle size={14} />
            收款
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <InfoCard label="联系人" value={customer.contact} />
        <InfoCard label="账期" value={`${customer.paymentPeriod} 天`} />
        <InfoCard label="应收金额" value={money(receivableAmount)} tone="text-slate-800" />
        <InfoCard label="余额" value={money(balance)} tone="text-rose-600" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">应收明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="p-3">来源单号 SOO</th>
                <th className="p-3 text-right">金额</th>
                <th className="p-3 text-right">已收</th>
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
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">收款记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="p-3">收款单 RC</th>
                <th className="p-3">核销 SOO</th>
                <th className="p-3 text-right">收款金额</th>
                <th className="p-3">收款日期</th>
                <th className="p-3">操作人</th>
                <th className="p-3">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map(row => (
                <tr key={row.id}>
                  <td className="p-3 font-mono font-bold text-emerald-600">{row.id}</td>
                  <td className="p-3 font-mono">{row.sourceNo}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{money(row.amount)}</td>
                  <td className="p-3 text-slate-500">{row.receiptDate}</td>
                  <td className="p-3">{row.operator}</td>
                  <td className="p-3 text-slate-500">{row.remark || '-'}</td>
                </tr>
              ))}
              {receipts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">暂无收款记录</td></tr>}
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
