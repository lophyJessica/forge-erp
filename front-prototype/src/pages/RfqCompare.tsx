import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShoppingCart } from 'lucide-react';
import { rfqApi } from '../api/rfq';
import type { RfqAwardLine, RfqOrder } from '../types/rfq';
import { Button } from '../components/ui/Button';

export default function RfqCompare() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [rfq, setRfq] = useState<RfqOrder | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const row = rfqApi.getById(id);
    if (!row) {
      alert('询价单不存在');
      navigate('/purchase/rfq');
      return;
    }
    setRfq(row);
    const initial: Record<string, string> = {};
    row.awards?.forEach(award => {
      initial[award.itemId] = award.supplierCode;
    });
    setSelected(initial);
  }, [id]);

  if (!rfq) {
    return <div className="p-8 text-center text-slate-400">正在加载比价数据...</div>;
  }

  const submittedQuotes = rfq.quotes.filter(quote => quote.status === 'SUBMITTED');
  const selectedCount = Object.keys(selected).length;
  const totalAmount = rfq.items.reduce((sum, item) => {
    const supplierCode = selected[item.id];
    const quoteLine = rfq.quotes.find(quote => quote.supplierCode === supplierCode)?.lines.find(line => line.itemId === item.id);
    return sum + (quoteLine ? quoteLine.unitPrice * item.quantity : 0);
  }, 0);

  const handleAward = () => {
    if (selectedCount !== rfq.items.length) {
      alert('请为每个商品行选择中标供应商');
      return;
    }

    try {
      const awards: RfqAwardLine[] = rfq.items.map(item => ({
        itemId: item.id,
        supplierCode: selected[item.id],
      }));
      const result = rfqApi.awardAndCreatePo(rfq.id, awards);
      alert(`定标成功，已自动生成采购订单草稿：${result.poIds.join('、')}`);
      navigate('/purchase/orders');
    } catch (err: any) {
      alert(err.message || '定标失败');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/purchase/rfq')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">报价对比与定标 {rfq.id}</h1>
            <p className="text-xs text-slate-500 mt-1">{rfq.title} | 截止日期 {rfq.deadline}</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>已选 <span className="font-bold text-primary">{selectedCount}</span> / {rfq.items.length} 行</div>
          <div className="mt-1">定标金额 <span className="font-bold text-slate-800">¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">多供应商多商品横向比价矩阵</h3>
          <span className="text-xs text-slate-500">横轴为商品行，纵轴为供应商，每格展示单价 / 交期 / 税率。</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="p-3 text-left w-52 sticky left-0 bg-slate-50 z-10">供应商</th>
                {rfq.items.map(item => (
                  <th key={item.id} className="p-3 text-left min-w-[220px] border-l border-slate-100 align-top">
                    <div className="font-bold text-slate-700">{item.productCode}</div>
                    <div className="mt-0.5 text-slate-500">{item.productName}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">{item.productSpec} / {item.unit} / 数量 {item.quantity}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submittedQuotes.map(quote => (
                <tr key={quote.supplierCode} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-700 sticky left-0 bg-white z-10">
                    <div>{quote.supplierName}</div>
                    <div className="mt-1 text-[10px] text-slate-400 font-mono">{quote.supplierCode}</div>
                    <div className="mt-1 text-[10px] text-emerald-600">已报价</div>
                  </td>
                  {rfq.items.map(item => {
                    const line = quote.lines.find(row => row.itemId === item.id);
                    const checked = selected[item.id] === quote.supplierCode;
                    return (
                      <td key={`${quote.supplierCode}-${item.id}`} className={`p-3 border-l border-slate-100 align-top ${checked ? 'bg-emerald-50/60' : ''}`}>
                        {line ? (
                          <label className="block cursor-pointer">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="radio"
                                name={`award-${item.id}`}
                                checked={checked}
                                onChange={() => setSelected(prev => ({ ...prev, [item.id]: quote.supplierCode }))}
                                className="text-primary border-slate-300 focus:ring-primary"
                              />
                              {checked && <CheckCircle size={14} className="text-emerald-600" />}
                            </div>
                            <div className="mt-2 space-y-1 font-mono">
                              <div>单价：<span className="font-bold text-slate-800">¥{line.unitPrice.toFixed(2)}</span></div>
                              <div>交期：<span className="font-bold text-blue-700">{line.deliveryDays} 天</span></div>
                              <div>税率：<span className="font-bold text-slate-700">{line.taxRate || '-'}</span></div>
                            </div>
                          </label>
                        ) : (
                          <div className="text-slate-400">未报价</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {submittedQuotes.length === 0 && (
                <tr>
                  <td colSpan={rfq.items.length + 1} className="p-8 text-center text-slate-400">暂无供应商提交报价</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/rfq')}>返回</Button>
        <Button
          size="sm"
          onClick={handleAward}
          disabled={submittedQuotes.length === 0 || selectedCount !== rfq.items.length}
          className="flex items-center gap-1.5 font-bold"
        >
          <ShoppingCart size={14} />
          定标并生成PO草稿
        </Button>
      </div>
    </div>
  );
}
