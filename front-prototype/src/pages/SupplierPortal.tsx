import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle, Send } from 'lucide-react';
import { rfqApi } from '../api/rfq';
import { MOCK_SUPPLIERS } from '../api/purchaseOrder';
import type { RfqOrder, RfqQuoteLine } from '../types/rfq';
import type { TaxRate } from '../types/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import PageTitle from '../components/shared/PageTitle';
import PageHeader from '../components/shared/PageHeader';
import DataTable from '../components/shared/DataTable';

export default function SupplierPortal() {
  const [supplierCode, setSupplierCode] = useState(MOCK_SUPPLIERS[0]?.code || '');
  const [rfqs, setRfqs] = useState<RfqOrder[]>([]);
  const [current, setCurrent] = useState<RfqOrder | null>(null);
  const [lines, setLines] = useState<RfqQuoteLine[]>([]);

  const supplier = MOCK_SUPPLIERS.find(item => item.code === supplierCode) || MOCK_SUPPLIERS[0];

  const loadData = () => {
    setRfqs(rfqApi.getList('QUOTING'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRfq = (row: RfqOrder) => {
    const quote = row.quotes.find(item => item.supplierCode === supplierCode);
    setCurrent(row);
    setLines(row.items.map(item => {
      const existing = quote?.lines.find(line => line.itemId === item.id);
      return existing || { itemId: item.id, unitPrice: 0, deliveryDays: 3, taxRate: '13%' as TaxRate };
    }));
  };

  const updateLine = (itemId: string, field: keyof RfqQuoteLine, value: string) => {
    setLines(prev => prev.map(line => {
      if (line.itemId !== itemId) return line;
      if (field === 'taxRate') return { ...line, taxRate: value as TaxRate };
      return { ...line, [field]: Number(value) };
    }));
  };

  const submitQuote = () => {
    if (!current) return;
    const invalid = lines.some(line => line.unitPrice <= 0 || line.deliveryDays <= 0);
    if (invalid) {
      alert('请完整填写单价和交期，且必须大于0');
      return;
    }

    try {
      rfqApi.submitQuote(current.id, supplierCode, lines);
      alert('报价已提交');
      setCurrent(null);
      loadData();
    } catch (err: any) {
      alert(err.message || '报价提交失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg"><Building2 size={18} /></div>
          <div>
            <h1 className="text-sm font-bold">强盛科技供应商报价门户</h1>
            <p className="text-[10px] text-slate-400">Supplier Portal / RFQ Quotation</p>
          </div>
        </div>
        <select
          value={supplierCode}
          onChange={e => {
            setSupplierCode(e.target.value);
            setCurrent(null);
          }}
          className="h-9 rounded-md bg-slate-800 border border-slate-700 px-3 text-xs font-semibold"
        >
          {MOCK_SUPPLIERS.map(item => <option key={item.code} value={item.code}>{item.code} {item.name}</option>)}
        </select>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-4">
        {!current ? (
          <>
            <PageTitle compact title="待报价列表" description={`当前模拟登录供应商：${supplier.name}`} />
            <DataTable minWidth="860px">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                    <th className="p-3 w-44">询价单号</th>
                    <th className="p-3">标题</th>
                    <th className="p-3 w-32">截止日期</th>
                    <th className="p-3 w-24 text-right">商品种数</th>
                    <th className="p-3 w-24 text-center">状态</th>
                    <th className="p-3 w-28 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rfqs.map(row => {
                    const submitted = row.quotes.some(quote => quote.supplierCode === supplierCode && quote.status === 'SUBMITTED');
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-primary">{row.id}</td>
                        <td className="p-3 font-medium">{row.title}</td>
                        <td className="p-3">{row.deadline}</td>
                        <td className="p-3 text-right font-mono">{row.itemCount}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${submitted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {submitted && <CheckCircle size={12} />}
                            {submitted ? '已报价' : '待报价'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => openRfq(row)} className="p-1 text-primary hover:underline font-semibold cursor-pointer">
                            {submitted ? '修改报价' : '去报价'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {rfqs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">暂无待报价询价单</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DataTable>
          </>
        ) : (
          <div className="space-y-4">
            <PageHeader title={`提交报价 ${current.id}`} description={`${current.title} | 截止日期 ${current.deadline}`} onBack={() => setCurrent(null)} />

            <DataTable minWidth="980px">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                    <th className="p-3 w-32">编码</th>
                    <th className="p-3">名称</th>
                    <th className="p-3 w-28">规格</th>
                    <th className="p-3 w-20">单位</th>
                    <th className="p-3 w-24 text-right">数量</th>
                    <th className="p-3 w-36 text-right">单价</th>
                    <th className="p-3 w-32 text-right">交期</th>
                    <th className="p-3 w-28">税率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {current.items.map(item => {
                    const line = lines.find(row => row.itemId === item.id);
                    return (
                      <tr key={item.id}>
                        <td className="p-3 font-mono font-semibold">{item.productCode}</td>
                        <td className="p-3 font-medium">{item.productName}</td>
                        <td className="p-3 text-slate-500">{item.productSpec}</td>
                        <td className="p-3 text-slate-500">{item.unit}</td>
                        <td className="p-3 text-right font-mono">{item.quantity}</td>
                        <td className="p-3">
                          <Input type="number" min="0" value={line?.unitPrice || 0} onChange={e => updateLine(item.id, 'unitPrice', e.target.value)} className="h-8 text-right text-xs font-mono" />
                        </td>
                        <td className="p-3">
                          <Input type="number" min="1" value={line?.deliveryDays || 1} onChange={e => updateLine(item.id, 'deliveryDays', e.target.value)} className="h-8 text-right text-xs font-mono" />
                        </td>
                        <td className="p-3">
                          <select value={line?.taxRate || '13%'} onChange={e => updateLine(item.id, 'taxRate', e.target.value)} className="w-full h-8 border border-slate-200 rounded-md px-2">
                            {['0%', '3%', '6%', '9%', '13%'].map(rate => <option key={rate} value={rate}>{rate}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DataTable>

            <div className="flex justify-end bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <Button onClick={submitQuote} size="sm" className="flex items-center gap-1.5 font-bold">
                <Send size={14} /> 提交报价
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
