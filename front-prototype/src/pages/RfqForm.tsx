import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Send, Trash2 } from 'lucide-react';
import { rfqApi } from '../api/rfq';
import { MOCK_PRODUCTS } from '../api/purchaseOrder';
import type { RfqItem, RfqOrder } from '../types/rfq';
import { RFQ_STATUS_LABELS } from '../types/rfq';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

function newLine(index: number): RfqItem {
  const product = MOCK_PRODUCTS[index % MOCK_PRODUCTS.length];
  return {
    id: `line-${Date.now()}-${index}`,
    productCode: product.code,
    productName: product.name,
    productSpec: product.spec,
    unit: product.unit,
    quantity: 1,
  };
}

export default function RfqForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = location.pathname.endsWith('/edit');
  const readOnly = !!id && !isEdit;

  const [origin, setOrigin] = useState<RfqOrder | null>(null);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [items, setItems] = useState<RfqItem[]>([newLine(0)]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const row = rfqApi.getById(id);
    if (!row) {
      alert('询价单不存在');
      navigate('/purchase/rfq');
      return;
    }
    setOrigin(row);
    setTitle(row.title);
    setDeadline(row.deadline);
    setItems(row.items);
  }, [id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = '请输入询价标题';
    if (!deadline) next.deadline = '请选择截止日期';
    if (items.length === 0) next.items = '至少包含一行商品明细';
    items.forEach(item => {
      if (!item.quantity || item.quantity <= 0) next[`qty-${item.id}`] = '数量必须大于0';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleProductChange = (lineId: string, productCode: string) => {
    const product = MOCK_PRODUCTS.find(item => item.code === productCode);
    if (!product) return;
    setItems(prev => prev.map(item => item.id === lineId ? {
      ...item,
      productCode: product.code,
      productName: product.name,
      productSpec: product.spec,
      unit: product.unit,
    } : item));
  };

  const handleSave = (publish: boolean) => {
    if (readOnly) return;
    if (!validate()) {
      alert('表单校验未通过，请检查红字提示字段');
      return;
    }

    try {
      const payload = { title: title.trim(), deadline, items };
      if (id) {
        const saved = rfqApi.update(id, payload);
        if (publish) rfqApi.publish(saved.id);
        alert(publish ? '询价单已发布，供应商端可见' : '询价单草稿已保存');
      } else {
        rfqApi.create(payload, publish);
        alert(publish ? '询价单已创建并发布，供应商端可见' : '询价单草稿已保存');
      }
      navigate('/purchase/rfq');
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchase/rfq')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">{id ? `${readOnly ? '查看' : '编辑'}询价单 ${id}` : '新建询价单'}</h1>
            <p className="text-xs text-slate-500 mt-0.5">保存草稿后可发布询价；发布后供应商端可报价。</p>
          </div>
        </div>
        {origin && (
          <span className="px-2 py-0.5 rounded border bg-slate-50 text-xs font-semibold text-slate-600">
            {RFQ_STATUS_LABELS[origin.status]}
          </span>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="md:col-span-3">
            <label className="block text-slate-500 font-semibold mb-1">标题 <span className="text-rose-500">*</span></label>
            <Input value={title} onChange={e => setTitle(e.target.value)} disabled={readOnly} className={errors.title ? 'border-rose-400' : ''} />
            {errors.title && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.title}</span>}
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">截止日期 <span className="text-rose-500">*</span></label>
            <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} disabled={readOnly} className={errors.deadline ? 'border-rose-400' : ''} />
            {errors.deadline && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.deadline}</span>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">商品明细</h3>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, newLine(prev.length)])} className="flex items-center gap-1 h-8 text-xs">
              <Plus size={14} /> 增加商品
            </Button>
          )}
        </div>
        {errors.items && <div className="text-xs text-rose-500">{errors.items}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-12 text-center">序号</th>
                <th className="p-3 w-52">编码</th>
                <th className="p-3">名称</th>
                <th className="p-3 w-32">规格</th>
                <th className="p-3 w-20">单位</th>
                <th className="p-3 w-32 text-right">数量</th>
                {!readOnly && <th className="p-3 w-16 text-center">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/40">
                  <td className="p-3 text-center text-slate-400">{index + 1}</td>
                  <td className="p-3">
                    {readOnly ? (
                      <span className="font-mono font-semibold">{item.productCode}</span>
                    ) : (
                      <select value={item.productCode} onChange={e => handleProductChange(item.id, e.target.value)} className="w-full h-9 border border-slate-200 rounded-md px-2">
                        {MOCK_PRODUCTS.map(product => <option key={product.code} value={product.code}>{product.code}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="p-3 font-medium text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-slate-500">{item.unit}</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      disabled={readOnly}
                      onChange={e => setItems(prev => prev.map(row => row.id === item.id ? { ...row, quantity: Number(e.target.value) } : row))}
                      className={`h-8 text-right text-xs font-mono ${errors[`qty-${item.id}`] ? 'border-rose-400' : ''}`}
                    />
                    {errors[`qty-${item.id}`] && <span className="text-rose-500 text-[10px] block text-right">{errors[`qty-${item.id}`]}</span>}
                  </td>
                  {!readOnly && (
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setItems(prev => prev.length <= 1 ? prev : prev.filter(row => row.id !== item.id))}
                        className="inline-flex p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/rfq')}>返回</Button>
        {!readOnly && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} className="flex items-center gap-1.5">
              <Save size={14} /> 保存草稿
            </Button>
            <Button size="sm" onClick={() => handleSave(true)} className="flex items-center gap-1.5 font-bold">
              <Send size={14} /> 发布询价
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
