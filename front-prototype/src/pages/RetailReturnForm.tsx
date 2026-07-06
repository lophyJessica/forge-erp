import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import { retailApi } from '../api/retail';
import type { RetailReturn } from '../types/retail';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RetailReturnForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('source_id');
  const [data, setData] = useState<RetailReturn | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (!sourceId) {
        alert('必须从原零售单 RS 下推创建零售退货');
        navigate('/retail/orders');
        return;
      }
      setData(retailApi.createRetailReturnFromRS(sourceId));
    } catch (err: any) {
      alert(err.message || '初始化零售退货失败');
      navigate('/retail/orders');
    }
  }, [sourceId, navigate]);

  if (!data) return <div className="p-8 text-center text-slate-400">正在初始化零售退货单...</div>;

  const refreshTotals = (next: RetailReturn): RetailReturn => {
    const items = next.items.map(item => ({
      ...item,
      amount: parseFloat((item.returnQuantity * item.price).toFixed(2))
    }));
    return {
      ...next,
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.returnQuantity, 0),
      refundAmount: parseFloat(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2))
    };
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!data.returnDate) next.returnDate = '退货日期必填';
    if (data.returnDate > new Date().toISOString().split('T')[0]) next.returnDate = '退货日期不能晚于今天';
    data.items.forEach(item => {
      if (item.returnQuantity <= 0) next[`qty-${item.id}`] = '退货数量必须大于 0';
      if (item.returnQuantity > item.purchaseQuantity) next[`qty-${item.id}`] = `不能超过原购买数 ${item.purchaseQuantity}`;
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

  const confirmReturn = () => {
    if (!validate()) {
      alert('请修正页面红色报错后再确认退货');
      return;
    }
    try {
      retailApi.confirmRetailReturn(data);
      alert('确认零售退货成功：已回补库存并按原支付方式退款');
      navigate('/retail/returns');
    } catch (err: any) {
      alert(err.message || '确认失败');
    }
  };

  return (
    <div className="space-y-4 pb-20 text-xs">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/retail/orders')} className="p-1 hover:bg-slate-100 rounded">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">从 RS 下推零售退货</h1>
          <p className="text-slate-500 mt-1">退货单号：<span className="font-mono font-bold text-primary">{data.id}</span></p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Readonly label="来源零售单号">
            <span className="font-mono text-primary flex items-center gap-1">
              {data.sourceRetailOrderId}
              <ExternalLink size={11} />
            </span>
          </Readonly>
          <Readonly label="收银员">{data.cashierName}</Readonly>
          <Readonly label="仓库">{data.warehouseName}</Readonly>
          <Readonly label="原路退款">{retailApi.getPaymentLabel(data.paymentMethod)}</Readonly>
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">退货日期</label>
            <Input type="date" value={data.returnDate} onChange={event => setData({ ...data, returnDate: event.target.value })} className={`h-9 text-xs ${errors.returnDate ? 'border-rose-500' : ''}`} />
            {errors.returnDate && <p className="text-[10px] text-rose-500 font-bold">{errors.returnDate}</p>}
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
                <th className="p-3 w-24 text-right">原购买数</th>
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
                  <td className="p-3 text-right font-bold text-primary">{item.purchaseQuantity}</td>
                  <td className="p-3">
                    <Input type="number" min="0" max={item.purchaseQuantity} value={item.returnQuantity} onChange={event => setQty(item.id, event.target.value)} className={`h-8 text-xs text-right font-bold ${errors[`qty-${item.id}`] ? 'border-rose-500' : ''}`} />
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
          <span className="text-emerald-600">退款金额：¥{money(data.refundAmount)}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 px-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-40 flex justify-between items-center">
        <button type="button" onClick={() => navigate('/retail/orders')} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">返回零售单</button>
        <Button size="sm" onClick={confirmReturn} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle size={14} />
          确认退货
        </Button>
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
