import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, Save } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesReturn } from '../types/sales';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SalesReturnForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('source_id');
  const [data, setData] = useState<SalesReturn | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (id) {
        const sr = salesApi.getSalesReturnById(id);
        if (!sr) throw new Error('销售退货单不存在');
        if (sr.status !== 'DRAFT') {
          alert('只有草稿销售退货单可以编辑');
          navigate(`/sales/returns/${sr.id}`);
          return;
        }
        setData(JSON.parse(JSON.stringify(sr)));
      } else if (sourceId) {
        setData(salesApi.createSalesReturnFromSOO(sourceId));
      } else {
        alert('必须从已确认销售出库单 SOO 下推创建销售退货单');
        navigate('/sales/outbounds');
      }
    } catch (err: any) {
      alert(err.message || '初始化销售退货单失败');
      navigate('/sales/outbounds');
    }
  }, [id, sourceId, navigate]);

  if (!data) return <div className="p-8 text-center text-slate-400">正在初始化销售退货单...</div>;

  const refreshTotals = (next: SalesReturn): SalesReturn => {
    const items = next.items.map(item => ({
      ...item,
      amount: parseFloat((item.returnQuantity * item.price).toFixed(2))
    }));
    return {
      ...next,
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.returnQuantity, 0),
      totalAmount: parseFloat(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2))
    };
  };

  const validate = (confirming: boolean) => {
    const next: Record<string, string> = {};
    if (!data.returnDate) next.returnDate = '退货日期必填';
    if (data.returnDate > new Date().toISOString().split('T')[0]) next.returnDate = '退货日期不能晚于今天';
    if (!data.returnReason.trim()) next.returnReason = '退货原因必填';
    if (data.returnReason.length > 200) next.returnReason = '退货原因最多 200 字';
    data.items.forEach(item => {
      if (item.returnQuantity > item.outboundQuantity) next[`qty-${item.id}`] = `不能超过已出数量 ${item.outboundQuantity}`;
      if (confirming && item.returnQuantity <= 0) next[`qty-${item.id}`] = '确认退货时数量必须大于 0';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setQty = (itemId: string, value: string) => {
    const qty = value === '' ? 0 : parseInt(value, 10);
    setData(refreshTotals({
      ...data,
      items: data.items.map(item => item.id === itemId ? { ...item, returnQuantity: Number.isNaN(qty) ? 0 : qty } : item)
    }));
  };

  const saveDraft = () => {
    if (!validate(false)) return;
    try {
      salesApi.saveSalesReturnDraft(data);
      alert('草稿保存成功');
      navigate(`/sales/returns/${data.id}`);
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const confirmReturn = () => {
    if (!validate(true)) {
      alert('请修正页面红色报错后再确认退货');
      return;
    }
    try {
      salesApi.confirmSalesReturn(data.id, data);
      alert('确认退货成功：已回补现存并冲减应收');
      navigate(`/sales/returns/${data.id}`);
    } catch (err: any) {
      alert(err.message || '确认失败');
    }
  };

  return (
    <div className="space-y-4 pb-20 text-xs">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/sales/returns')} className="p-1 hover:bg-slate-100 rounded">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{id ? '编辑销售退货单' : '从 SOO 下推销售退货单'}</h1>
          <p className="text-slate-500 mt-1">单号：<span className="font-mono font-bold text-primary">{data.id}</span></p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Readonly label="来源 SOO 号">
            <Link to={`/sales/outbounds/${data.sourceOutboundId}`} className="font-mono text-primary hover:underline flex items-center gap-1">
              {data.sourceOutboundId}
              <ExternalLink size={11} />
            </Link>
          </Readonly>
          <Readonly label="客户">{data.customerName}</Readonly>
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">退货日期</label>
            <Input type="date" value={data.returnDate} onChange={event => setData({ ...data, returnDate: event.target.value })} className={`h-9 text-xs ${errors.returnDate ? 'border-rose-500' : ''}`} />
            {errors.returnDate && <p className="text-[10px] text-rose-500 font-bold">{errors.returnDate}</p>}
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="font-semibold text-slate-500 block">退货原因 <span className="text-rose-500">*</span></label>
            <Textarea value={data.returnReason} onChange={event => setData({ ...data, returnReason: event.target.value })} maxLength={220} rows={3} className={`text-xs ${errors.returnReason ? 'border-rose-500' : ''}`} placeholder="请填写退货原因，最多 200 字" />
            <div className="flex justify-between text-[10px]">
              <span className={errors.returnReason ? 'text-rose-500 font-bold' : 'text-slate-400'}>{errors.returnReason || '确认退货时必填'}</span>
              <span className={data.returnReason.length > 200 ? 'text-rose-500 font-bold' : 'text-slate-400'}>{data.returnReason.length}/200</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">退货明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-28">编码</th>
                <th className="p-3">名称</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 w-24 text-right">已出数量</th>
                <th className="p-3 w-28 text-right">退货数量</th>
                <th className="p-3 w-28 text-right">单价</th>
                <th className="p-3 w-32 text-right">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold">{item.productCode}</td>
                  <td className="p-3 font-bold text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-slate-500">{item.unit}</td>
                  <td className="p-3 text-right font-bold text-primary">{item.outboundQuantity}</td>
                  <td className="p-3">
                    <Input type="number" min="0" max={item.outboundQuantity} value={item.returnQuantity} onChange={event => setQty(item.id, event.target.value)} className={`h-8 text-xs text-right font-bold ${errors[`qty-${item.id}`] ? 'border-rose-500' : ''}`} />
                    {errors[`qty-${item.id}`] && <p className="text-[10px] text-right text-rose-500 font-bold mt-1">{errors[`qty-${item.id}`]}</p>}
                  </td>
                  <td className="p-3 text-right font-semibold">¥{money(item.price)}</td>
                  <td className="p-3 text-right font-black">¥{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100 flex justify-between font-bold">
          <span>商品种数：{data.itemCount}</span>
          <span>退货数量：{data.totalQuantity}</span>
          <span className="text-rose-600">退货总金额：¥{money(data.totalAmount)}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 px-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-40 flex justify-between items-center">
        <button type="button" onClick={() => navigate('/sales/returns')} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">返回列表</button>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={saveDraft} className="gap-1 font-bold"><Save size={14} />保存草稿</Button>
          <Button size="sm" onClick={confirmReturn} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700"><CheckCircle size={14} />确认退货</Button>
        </div>
      </div>
    </div>
  );
}

function Readonly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="font-semibold text-slate-500 block">{label}</span>
      <div className="h-9 rounded-md border border-slate-100 bg-slate-50 px-3 flex items-center font-bold text-slate-700">{children}</div>
    </div>
  );
}
