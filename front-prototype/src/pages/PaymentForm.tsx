import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { financeApi } from '../api/finance';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function PaymentForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const suppliers = financeApi.getSuppliers();
  const [supplierCode, setSupplierCode] = useState(params.get('supplierCode') || suppliers[0]?.code || '');
  const [sourceNo, setSourceNo] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const openSources = useMemo(() => financeApi.getOpenPayableSources(supplierCode), [supplierCode]);
  const selectedSource = openSources.find(item => item.sourceNo === sourceNo);

  useEffect(() => {
    const first = openSources[0];
    setSourceNo(first?.sourceNo || '');
    setAmount(first?.balance || 0);
  }, [supplierCode]);

  const submit = () => {
    try {
      setError('');
      const record = financeApi.createPayment({ supplierCode, sourceNo, amount, paymentDate, remark });
      alert(`付款成功：${record.id}`);
      navigate('/finance/payments');
    } catch (err: any) {
      setError(err?.message || '付款失败');
    }
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <button onClick={() => navigate('/finance/payments')} className="p-1 hover:bg-slate-100 rounded">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">新建付款单</h1>
          <p className="text-xs text-slate-500 mt-1">选择未核销 PI，付款金额不能超过未核销余额。</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-5 max-w-3xl">
        {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-bold text-slate-500">关联供应商</span>
            <select value={supplierCode} onChange={event => setSupplierCode(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs">
              {suppliers.map(supplier => <option key={supplier.code} value={supplier.code}>{supplier.code} {supplier.name}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold text-slate-500">付款日期</span>
            <Input type="date" value={paymentDate} onChange={event => setPaymentDate(event.target.value)} className="h-10 text-xs" />
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-xs font-bold text-slate-500">选择未核销 PI</span>
          <select
            value={sourceNo}
            onChange={event => {
              const next = openSources.find(item => item.sourceNo === event.target.value);
              setSourceNo(event.target.value);
              setAmount(next?.balance || 0);
            }}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs"
          >
            {openSources.map(source => (
              <option key={source.sourceNo} value={source.sourceNo}>
                {source.sourceNo} / 原额 {money(source.amount)} / 未核销 {money(source.balance)}
              </option>
            ))}
          </select>
        </label>

        {selectedSource && (
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="来源金额" value={money(selectedSource.amount)} />
            <InfoCard label="已付金额" value={money(selectedSource.settledAmount)} tone="text-emerald-600" />
            <InfoCard label="未核销余额" value={money(selectedSource.balance)} tone="text-rose-600" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-bold text-slate-500">付款金额</span>
            <Input type="number" min="0" step="0.01" value={amount} onChange={event => setAmount(Number(event.target.value || 0))} className="h-10 text-xs" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold text-slate-500">备注</span>
            <Input value={remark} onChange={event => setRemark(event.target.value)} placeholder="请输入备注" className="h-10 text-xs" />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={() => navigate('/finance/payments')}>取消</Button>
          <Button onClick={submit} disabled={!sourceNo || amount <= 0} className="gap-1.5 font-bold">
            <CheckCircle size={14} />
            核销付款
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, tone = 'text-slate-800' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="text-[11px] font-bold text-slate-400">{label}</div>
      <div className={`mt-1 text-sm font-black ${tone}`}>{value}</div>
    </div>
  );
}
