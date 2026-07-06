import { useMemo, useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { financeApi } from '../api/finance';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function PaymentList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const records = financeApi.getPaymentRecords();

  const rows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter(row =>
      row.id.toLowerCase().includes(normalized)
      || row.supplierCode.toLowerCase().includes(normalized)
      || row.supplierName.toLowerCase().includes(normalized)
      || row.sourceNo.toLowerCase().includes(normalized)
    );
  }, [records, keyword]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold text-slate-800">付款单</h1>
          <p className="text-xs text-slate-500 mt-1">PY 按来源 PI 核销，应付余额自动扣减。</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索 PY / 供应商 / PI" className="h-9 pl-9 text-xs" />
          </div>
          <Button size="sm" onClick={() => navigate('/finance/payments/new')} className="gap-1.5 font-bold">
            <PlusCircle size={14} />
            新建付款单
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
              <th className="p-3 w-40">付款单 PY</th>
              <th className="p-3 w-28">供应商编码</th>
              <th className="p-3">供应商名称</th>
              <th className="p-3 w-40">核销 PI</th>
              <th className="p-3 w-32 text-right">付款金额</th>
              <th className="p-3 w-28">付款日期</th>
              <th className="p-3 w-24">操作人</th>
              <th className="p-3">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-mono font-bold text-emerald-600">{row.id}</td>
                <td className="p-3 font-mono font-bold text-primary">{row.supplierCode}</td>
                <td className="p-3 font-semibold text-slate-800">{row.supplierName}</td>
                <td className="p-3 font-mono">{row.sourceNo}</td>
                <td className="p-3 text-right font-extrabold text-emerald-600">{money(row.amount)}</td>
                <td className="p-3 text-slate-500">{row.paymentDate}</td>
                <td className="p-3">{row.operator}</td>
                <td className="p-3 text-slate-500">{row.remark || '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">暂无付款记录</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
