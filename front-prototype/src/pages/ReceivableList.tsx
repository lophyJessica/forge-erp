import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, PlusCircle } from 'lucide-react';
import { financeApi } from '../api/finance';
import { SETTLEMENT_STATUS_LABELS, ReceivableSummary, SettlementStatus } from '../types/finance';
import { Button } from '../components/ui/Button';

const TABS: Array<SettlementStatus | 'ALL'> = ['ALL', 'UNSETTLED', 'PARTIAL', 'SETTLED'];

const STATUS_META: Record<SettlementStatus | 'ALL', { label: string; classes: string }> = {
  ALL: { label: '全部', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
  UNSETTLED: { label: '未核销', classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  PARTIAL: { label: '部分核销', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  SETTLED: { label: '已核销', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: SettlementStatus }) {
  const meta = STATUS_META[status];
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${meta.classes}`}>{meta.label}</span>;
}

export default function ReceivableList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettlementStatus | 'ALL'>('ALL');
  const [rows, setRows] = useState<ReceivableSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadData = () => {
    setRows(financeApi.getReceivableSummaries(activeTab));
    const nextCounts: Record<string, number> = {};
    TABS.forEach(tab => {
      nextCounts[tab] = financeApi.getReceivableSummaries(tab).length;
    });
    setCounts(nextCounts);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold text-slate-800">应收管理</h1>
          <p className="text-xs text-slate-500 mt-1">按客户汇总展示：应收金额 = ΣSOO，已收金额 = ΣRC，余额自动计算。</p>
        </div>
        <Button size="sm" onClick={() => navigate('/finance/receipts/new')} className="gap-1.5 font-bold">
          <PlusCircle size={14} />
          新建收款单
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <div className="flex gap-2 flex-wrap border-b border-slate-100 pb-3">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                activeTab === tab ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab === 'ALL' ? '全部' : SETTLEMENT_STATUS_LABELS[tab]}
              <span className={`ml-1 ${activeTab === tab ? 'text-white/80' : 'text-slate-400'}`}>{counts[tab] || 0}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-28">客户编码</th>
                <th className="p-3">名称</th>
                <th className="p-3 w-32 text-right">应收金额</th>
                <th className="p-3 w-32 text-right">已收金额</th>
                <th className="p-3 w-32 text-right">余额</th>
                <th className="p-3 w-32">核销状态</th>
                <th className="p-3 w-36">最后交易日期</th>
                <th className="p-3 w-44">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.map(row => (
                <tr key={row.customerCode} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-primary">{row.customerCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{row.customerName}</td>
                  <td className="p-3 text-right font-bold">{money(row.receivableAmount)}</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">{money(row.receivedAmount)}</td>
                  <td className="p-3 text-right text-rose-600 font-extrabold">{money(row.balance)}</td>
                  <td className="p-3"><StatusBadge status={row.status} /></td>
                  <td className="p-3 text-slate-500">{row.lastTransactionDate}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/finance/receivables/${row.customerCode}`)} className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 font-semibold text-slate-600">
                        <Eye size={13} />
                        查看明细
                      </button>
                      {row.balance > 0 && (
                        <button onClick={() => navigate(`/finance/receipts/new?customerCode=${row.customerCode}`)} className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50 font-semibold text-emerald-600">
                          收款
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">暂无应收记录</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
