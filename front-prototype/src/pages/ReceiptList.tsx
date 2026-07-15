import { useMemo, useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { financeApi } from '../api/finance';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import PageTitle from '../components/shared/PageTitle';
import FilterForm from '../components/shared/FilterForm';
import DataTable from '../components/shared/DataTable';
import Pagination from '../components/shared/Pagination';
import { usePagination } from '../hooks/usePagination';

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function ReceiptList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const records = financeApi.getReceiptRecords();

  const rows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter(row =>
      row.id.toLowerCase().includes(normalized)
      || row.customerCode.toLowerCase().includes(normalized)
      || row.customerName.toLowerCase().includes(normalized)
      || row.sourceNo.toLowerCase().includes(normalized)
    );
  }, [records, keyword]);
  const { page, pageSize, pageRows, setPage, changePageSize } = usePagination(rows);

  return (
    <div className="space-y-4">
      <PageTitle compact title="收款单" description="RC 按来源 SOO 核销，应收余额自动扣减。" actions={(
        <Button size="sm" onClick={() => navigate('/finance/receipts/new')} className="gap-1.5 font-bold"><PlusCircle size={14} />新建收款单</Button>
      )} />
      <FilterForm onSubmit={event => event.preventDefault()} className="!p-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索 RC / 客户 / SOO" className="h-9 pl-9 text-xs" />
        </div>
      </FilterForm>

      <DataTable minWidth="980px">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
              <th className="p-3 w-40">收款单 RC</th>
              <th className="p-3 w-28">客户编码</th>
              <th className="p-3">客户名称</th>
              <th className="p-3 w-40">核销 SOO</th>
              <th className="p-3 w-32 text-right">收款金额</th>
              <th className="p-3 w-28">收款日期</th>
              <th className="p-3 w-24">操作人</th>
              <th className="p-3">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {pageRows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-mono font-bold text-emerald-600">{row.id}</td>
                <td className="p-3 font-mono font-bold text-primary">{row.customerCode}</td>
                <td className="p-3 font-semibold text-slate-800">{row.customerName}</td>
                <td className="p-3 font-mono">{row.sourceNo}</td>
                <td className="p-3 text-right font-extrabold text-emerald-600">{money(row.amount)}</td>
                <td className="p-3 text-slate-500">{row.receiptDate}</td>
                <td className="p-3">{row.operator}</td>
                <td className="p-3 text-slate-500">{row.remark || '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">暂无收款记录</td></tr>}
          </tbody>
        </table>
      </DataTable>
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </div>
  );
}
