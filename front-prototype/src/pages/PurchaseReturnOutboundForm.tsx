import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PurchaseReturnOutbound } from '../types/purchaseReturnOutbound';
import { purchaseReturnOutboundApi } from '../api/purchaseReturnOutbound';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function PurchaseReturnOutboundForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('source_id');

  const [proData, setProData] = useState<PurchaseReturnOutbound | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (id) {
        // 编辑模式
        const pro = purchaseReturnOutboundApi.getOutboundById(id);
        if (!pro) {
          alert(`退货出库单 ${id} 不存在`);
          navigate('/purchase/return-outbounds');
          return;
        }
        if (pro.status !== 'DRAFT') {
          alert('只有草稿状态的单据支持编辑修改');
          navigate(`/purchase/return-outbounds/${id}`);
          return;
        }
        setProData(JSON.parse(JSON.stringify(pro)));
      } else if (sourceId) {
        // 下推新建模式
        const draft = purchaseReturnOutboundApi.createOutboundFromPR(sourceId);
        setProData(draft);
      } else {
        alert('参数错误，必须由已确认的采购退货单(PR)下推创建');
        navigate('/purchase/returns');
      }
    } catch (e: any) {
      alert(e.message || '初始化失败');
      navigate('/purchase/returns');
    }
  }, [id, sourceId]);

  if (!proData) {
    return <div className="p-8 text-center text-slate-500 text-xs">加载数据中...</div>;
  }

  // --- 数量联动 ---
  const handleQtyChange = (itemId: string, valStr: string) => {
    let val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) val = 0;

    const items = proData.items.map(it => {
      if (it.id === itemId) {
        const amount = parseFloat((val * it.price).toFixed(2));
        return { ...it, outboundQuantity: val, amount };
      }
      return it;
    });

    const totalQuantity = items.reduce((sum, it) => sum + it.outboundQuantity, 0);
    const totalAmount = parseFloat(items.reduce((sum, it) => sum + it.amount, 0).toFixed(2));

    setProData({
      ...proData,
      items,
      totalQuantity,
      totalAmount
    });
  };

  const handleRowRemarkChange = (itemId: string, remark: string) => {
    const items = proData.items.map(it => {
      if (it.id === itemId) {
        return { ...it, remark };
      }
      return it;
    });
    setProData({ ...proData, items });
  };

  // 全局校验
  const validateForm = (isConfirmAction = false) => {
    const errs: Record<string, string> = {};

    if (!proData.outboundDate) {
      errs.outboundDate = '出库日期必填';
    }

    // 检查是否有商品超出PR退货限制
    let hasQtyError = false;
    proData.items.forEach(it => {
      if (it.outboundQuantity > it.returnQuantity) {
        errs[`qty_${it.id}`] = '出库数量不能大于退货申请数';
        hasQtyError = true;
      }
      if (isConfirmAction && it.outboundQuantity <= 0) {
        errs[`qty_${it.id}`] = '确认出库时数量必须大于 0';
        hasQtyError = true;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const hasValidationErrors = () => {
    for (const it of proData.items) {
      if (it.outboundQuantity > it.returnQuantity) return true;
      if (it.outboundQuantity <= 0) return true;
    }
    return false;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    try {
      purchaseReturnOutboundApi.saveOutbound(proData);
      alert('草稿保存成功');
      navigate('/purchase/return-outbounds');
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleConfirm = () => {
    if (!validateForm(true)) {
      alert('请检查并修改页面中的红色报错选项');
      return;
    }
    if (window.confirm('确认出库后将正式冲扣即时库存和应付款，是否确认？')) {
      try {
        purchaseReturnOutboundApi.confirmOutbound(proData.id, proData);
        alert('出库确认成功，库存及账款已更新');
        navigate(`/purchase/return-outbounds/${proData.id}`);
      } catch (err: any) {
        alert(err.message || '确认失败');
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 页头 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800">
              {id ? '编辑采购退货出库单' : '从退货单下推创建出库单'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">单号：{proData.id}</p>
          </div>
        </div>
      </div>

      {/* 主表单 */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* 基本信息 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">来源退货单号</label>
              <div 
                onClick={() => navigate(`/purchase/returns/${proData.sourceReturnId}`)}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex items-center font-mono font-bold text-primary hover:underline cursor-pointer"
              >
                {proData.sourceReturnId}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">供应商</label>
              <Input value={proData.supplierName} disabled className="bg-slate-50 border-slate-200 font-semibold" />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">仓库</label>
              <Input value={proData.warehouseName} disabled className="bg-slate-50 border-slate-200 font-semibold" />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">出库日期</label>
              <input
                type="date"
                value={proData.outboundDate}
                onChange={e => {
                  setProData({ ...proData, outboundDate: e.target.value });
                  setErrors(prev => ({ ...prev, outboundDate: '' }));
                }}
                className={`w-full rounded-md border ${
                  errors.outboundDate ? 'border-rose-500 bg-rose-50/10' : 'border-input'
                } bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none`}
              />
              {errors.outboundDate && <span className="text-[10px] text-rose-500 font-bold block">{errors.outboundDate}</span>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-500 block">出库备注</label>
              <textarea
                value={proData.remark}
                onChange={e => setProData({ ...proData, remark: e.target.value })}
                placeholder="请录入发货出库相关的运单号或供应商交接备注（选填）"
                className="w-full rounded-md border border-input px-3 py-2 text-xs text-slate-700 min-h-[50px] max-h-[120px] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 明细 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">退货出库商品明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="p-3 w-36">商品编码</th>
                  <th className="p-3">商品名称</th>
                  <th className="p-3 w-32">规格型号</th>
                  <th className="p-3 w-16">单位</th>
                  <th className="p-3 text-right w-24">退货申请数</th>
                  <th className="p-3 text-right w-28 text-primary">本次出库数</th>
                  <th className="p-3 text-right w-24">单价</th>
                  <th className="p-3 text-right w-28">金额</th>
                  <th className="p-3 w-40">行备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {proData.items.map(it => {
                  const hasQtyErr = !!errors[`qty_${it.id}`] || it.outboundQuantity > it.returnQuantity || it.outboundQuantity <= 0;

                  return (
                    <tr key={it.id} className="hover:bg-slate-50/20">
                      <td className="p-3 font-semibold text-slate-500">{it.productCode}</td>
                      <td className="p-3 font-semibold text-slate-800">{it.productName}</td>
                      <td className="p-3 text-slate-500">{it.productSpec}</td>
                      <td className="p-3 text-slate-400">{it.unit}</td>
                      {/* 退货数量：只读 */}
                      <td className="p-3 text-right font-bold text-slate-400">
                        {it.returnQuantity}
                      </td>
                      {/* 出库数量：编辑，强控不超过退货数量 */}
                      <td className="p-3 text-right">
                        <div className="inline-block w-24">
                          <input
                            type="number"
                            value={it.outboundQuantity}
                            onChange={e => handleQtyChange(it.id, e.target.value)}
                            min={0}
                            className={`w-full text-right rounded border ${
                              hasQtyErr ? 'border-rose-500 bg-rose-50/15 text-rose-600' : 'border-input'
                            } px-2 py-1 text-xs font-bold focus:outline-none`}
                          />
                          {it.outboundQuantity > it.returnQuantity && (
                            <span className="text-[9px] text-rose-500 font-bold block text-right mt-0.5">
                              超退货申请!
                            </span>
                          )}
                          {it.outboundQuantity <= 0 && (
                            <span className="text-[9px] text-rose-500 font-bold block text-right mt-0.5">
                              须大于0!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-500">
                        ¥{it.price.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900">
                        ¥{it.amount.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={it.remark || ''}
                          onChange={e => handleRowRemarkChange(it.id, e.target.value)}
                          placeholder="行备注"
                          className="w-full border-b border-transparent hover:border-slate-200 focus:border-primary px-1 py-0.5 focus:outline-none text-slate-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 汇总 */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 pt-4 text-xs font-bold text-slate-600 bg-slate-50/50 p-4 rounded-lg gap-2">
            <div>
              <span>商品种数：<strong className="text-slate-800 font-black">{proData.itemCount}</strong> 种</span>
              <span className="ml-4">出库总数量：<strong className="text-slate-800 font-black">{proData.totalQuantity}</strong> 件</span>
            </div>
            <div className="text-sm">
              <span>出库总金额 (含税)：<strong className="text-rose-600 font-black text-base">¥{proData.totalAmount.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {hasValidationErrors() ? (
              <span className="text-rose-500 font-extrabold flex items-center gap-1">
                <AlertCircle size={14} />
                存在超额出库或出库量小于等于0的异常数据，请修正后提交
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">校验状态：数据符合出库数量强控规则</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="h-9 px-4 flex items-center gap-1 font-bold bg-white"
            >
              返回
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="h-9 px-4 flex items-center gap-1 font-bold text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-white"
            >
              <Save size={14} />
              保存草稿
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={hasValidationErrors()}
              className="h-9 px-4 flex items-center gap-1 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle size={14} />
              确认出库
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
