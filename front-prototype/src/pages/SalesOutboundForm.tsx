import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, Save } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesOutbound, SalesOutboundItem } from '../types/sales';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

export default function SalesOutboundForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sourceId = searchParams.get('source_id');
  const isNewPush = location.pathname.includes('/new');

  const [outbound, setOutbound] = useState<SalesOutbound | null>(null);
  const [outboundDate, setOutboundDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<SalesOutboundItem[]>([]);
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    try {
      if (isNewPush && sourceId) {
        const draft = salesApi.createSalesOutboundFromSO(sourceId);
        navigate(`/sales/outbounds/${draft.id}/edit`, { replace: true });
        return;
      }
      if (!id) return;
      const existing = salesApi.getSalesOutboundById(id);
      if (!existing) {
        alert('销售出库单不存在');
        navigate('/sales/outbounds');
        return;
      }
      if (existing.status !== 'DRAFT') {
        alert('只有草稿销售出库单可以编辑');
        navigate(`/sales/outbounds/${existing.id}`);
        return;
      }
      setOutbound(existing);
      setOutboundDate(existing.outboundDate);
      setRemark(existing.remark || '');
      setItems(existing.items);
    } catch (err: any) {
      alert(err.message || '初始化销售出库单失败');
      navigate('/sales/outbounds');
    }
  }, [id, isNewPush, sourceId, navigate]);

  useEffect(() => {
    if (!outboundDate) {
      setGlobalError('出库日期不能为空');
      return;
    }
    if (outboundDate > new Date().toISOString().split('T')[0]) {
      setGlobalError('出库日期不能晚于今天');
      return;
    }
    const bad = items.find(item => item.outboundQuantity <= 0 || item.outboundQuantity > item.orderPendingQuantity);
    setGlobalError(bad ? `商品 ${bad.productName} 实出数量必须大于 0 且不能超过应出数量 ${bad.orderPendingQuantity}` : '');
  }, [outboundDate, items]);

  const handleQtyChange = (itemId: string, value: string) => {
    const qty = value === '' ? 0 : parseInt(value, 10);
    setItems(prev => prev.map(item => item.id === itemId ? {
      ...item,
      outboundQuantity: qty,
      amount: parseFloat((qty * item.price).toFixed(2))
    } : item));
  };

  const saveDraft = () => {
    if (!outbound) return;
    try {
      salesApi.saveSalesOutboundDraft(outbound.id, {
        outboundDate,
        remark,
        items: items.map(item => ({ id: item.id, outboundQuantity: item.outboundQuantity, remark: item.remark }))
      });
      alert('草稿保存成功');
      navigate(`/sales/outbounds/${outbound.id}`);
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const confirmOutbound = () => {
    if (!outbound) return;
    if (globalError) {
      alert(globalError);
      return;
    }
    try {
      salesApi.confirmSalesOutbound(outbound.id, {
        outboundDate,
        remark,
        items: items.map(item => ({ id: item.id, outboundQuantity: item.outboundQuantity, remark: item.remark }))
      });
      alert('确认出库成功：已扣减现存、释放占用、生成 FL 与应收');
      navigate(`/sales/outbounds/${outbound.id}`);
    } catch (err: any) {
      alert(err.message || '确认出库失败');
    }
  };

  if (!outbound) return <div className="p-8 text-center text-slate-400">正在初始化销售出库单...</div>;

  const totalQty = items.reduce((sum, item) => sum + item.outboundQuantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/sales/outbounds')} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">编辑销售出库单 {outbound.id}</h1>
            <p className="text-xs text-slate-500 mt-1">商品只读，实出数量不得超过应出数量。</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <Readonly label="来源 SO">
            <Link to={`/sales/orders/${outbound.salesOrderId}`} className="font-mono text-primary font-bold hover:underline flex items-center gap-1">
              {outbound.salesOrderId}
              <ExternalLink size={11} />
            </Link>
          </Readonly>
          <Readonly label="客户">{outbound.customerName}</Readonly>
          <Readonly label="仓库">{outbound.warehouseName}</Readonly>
          <div className="space-y-1">
            <label className="block text-slate-500 font-semibold">出库日期 <span className="text-rose-500">*</span></label>
            <Input type="date" value={outboundDate} onChange={e => setOutboundDate(e.target.value)} className="h-10 text-xs" />
          </div>
          <div className="md:col-span-4 space-y-1">
            <label className="block text-slate-500 font-semibold">出库备注</label>
            <Textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} className="text-xs" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">出库明细</h3>
        {globalError && <div className="p-3 rounded-md bg-rose-50 border border-rose-100 text-xs text-rose-600 font-semibold">{globalError}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-24 text-right">应出数量</th>
                <th className="p-3 w-28 text-right">实出数量</th>
                <th className="p-3 w-28 text-right">单价</th>
                <th className="p-3 w-32 text-right">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="p-3 text-center text-slate-400">{index + 1}</td>
                  <td className="p-3 font-semibold">{item.productCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-right font-bold text-primary">{item.orderPendingQuantity}</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="1"
                      max={item.orderPendingQuantity}
                      value={item.outboundQuantity}
                      onChange={e => handleQtyChange(item.id, e.target.value)}
                      className="h-8 text-xs text-right font-bold"
                    />
                  </td>
                  <td className="p-3 text-right font-semibold">¥{item.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-extrabold text-slate-800">¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md text-xs font-bold border border-slate-100">
          <span>商品种数：{items.length}</span>
          <span>实出总数量：<span className="text-primary">{totalQty}</span></span>
          <span>出库金额：<span className="text-rose-600 text-sm">¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 px-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-40 flex justify-between items-center">
        <button type="button" onClick={() => navigate('/sales/outbounds')} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">返回列表</button>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={saveDraft} className="gap-1 h-9 px-4 font-semibold"><Save size={14} />保存草稿</Button>
          <Button size="sm" onClick={confirmOutbound} className="gap-1 h-9 px-5 font-bold"><CheckCircle size={14} />确认出库</Button>
        </div>
      </div>
    </div>
  );
}

function Readonly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block text-slate-500 font-semibold">{label}</span>
      <div className="h-10 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-slate-700 font-bold">
        {children}
      </div>
    </div>
  );
}
