import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, PlusCircle } from 'lucide-react';
import { financeApi } from '../api/finance';
import { SETTLEMENT_STATUS_LABELS, PayableSummary, SettlementStatus } from '../types/finance';
import { Button } from '../components/ui/Button';
import PageTitle from '../components/shared/PageTitle';
import DataTable from '../components/shared/DataTable';
import Pagination from '../components/shared/Pagination';
import StatusTabs from '../components/shared/StatusTabs';
import { usePagination } from '../hooks/usePagination';

const TABS: Array<SettlementStatus | 'ALL'> = ['ALL', 'UNSETTLED', 'PARTIAL', 'SETTLED'];

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function PayableList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettlementStatus | 'ALL'>('ALL');
  const [rows, setRows] = useState<PayableSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const { page, pageSize, pageRows, setPage, changePageSize } = usePagination(rows);

  const loadData = () => {
    setRows(financeApi.getPayableSummaries(activeTab));
    const nextCounts: Record<string, number> = {};
    TABS.forEach(tab => {
      nextCounts[tab] = financeApi.getPayableSummaries(tab).length;
    });
    setCounts(nextCounts);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <div className="space-y-4">
      <PageTitle compact title="应付管理" description="按供应商汇总展示：应付金额 = ΣPI，已付金额 = ΣPY，余额自动计算。" actions={(
        <Button size="sm" onClick={() => navigate('/finance/payments/new')} className="gap-1.5 font-bold"><PlusCircle size={14} />新建付款单</Button>
      )} />

      <DataTable minWidth="980px">
        <StatusTabs
          items={TABS.map(tab => ({
            key: tab,
            label: tab === 'ALL' ? '全部' : SETTLEMENT_STATUS_LABELS[tab],
            count: counts[tab] || 0,
          }))}
          activeKey={activeTab}
          onChange={key => setActiveTab(key as SettlementStatus | 'ALL')}
          ariaLabel="应付核销状态筛选"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-28">供应商编码</th>
                <th className="p-3">名称</th>
                <th className="p-3 w-32 text-right">应付金额</th>
                <th className="p-3 w-32 text-right">已付金额</th>
                <th className="p-3 w-32 text-right">余额</th>
                <th className="p-3 w-32">核销状态</th>
                <th className="p-3 w-36">最后交易日期</th>
                <th className="p-3 w-44">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pageRows.map(row => (
                <tr key={row.supplierCode} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-primary">{row.supplierCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{row.supplierName}</td>
                  <td className="p-3 text-right font-bold">{money(row.payableAmount)}</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">{money(row.paidAmount)}</td>
                  <td className="p-3 text-right text-rose-600 font-extrabold">{money(row.balance)}</td>
                  <td className="p-3 font-bold text-slate-600">{SETTLEMENT_STATUS_LABELS[row.status]}</td>
                  <td className="p-3 text-slate-500">{row.lastTransactionDate}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/finance/payables/${row.supplierCode}`)} className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 font-semibold text-slate-600">
                        <Eye size={13} />
                        查看明细
                      </button>
                      {row.balance > 0 && (
                        <button onClick={() => navigate(`/finance/payments/new?supplierCode=${row.supplierCode}`)} className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50 font-semibold text-emerald-600">
                          付款
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">暂无应付记录</td></tr>}
            </tbody>
          </table>
        </div>
      </DataTable>
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </div>
  );
}
