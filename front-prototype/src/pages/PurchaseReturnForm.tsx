import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PurchaseReturn, PurchaseReturnItem } from '../types/purchaseReturn';
import { purchaseReturnApi } from '../api/purchaseReturn';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function PurchaseReturnForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get('source_id');

  const [prData, setPrData] = useState<PurchaseReturn | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (id) {
        // 编辑模式
        const pr = purchaseReturnApi.getReturnById(id);
        if (!pr) {
          alert(`退货单 ${id} 不存在`);
          navigate('/purchase/returns');
          return;
        }
        if (pr.status !== 'DRAFT') {
          alert('只有草稿状态的退货单才允许编辑');
          navigate(`/purchase/returns/${id}`);
          return;
        }
        setPrData(JSON.parse(JSON.stringify(pr)));
      } else if (sourceId) {
        // 下推新建模式
        const draft = purchaseReturnApi.createReturnFromPI(sourceId);
        setPrData(draft);
      } else {
        alert('参数错误，必须由已确认的采购入库单(PI)下推创建');
        navigate('/purchase/receipts');
      }
    } catch (e: any) {
      alert(e.message || '初始化失败');
      navigate('/purchase/receipts');
    }
  }, [id, sourceId]);

  if (!prData) {
    return <div className="p-8 text-center text-slate-500 text-xs">加载数据中...</div>;
  }

  // --- 明细数量联动与校验 ---
  const handleQtyChange = (itemId: string, valStr: string) => {
    let val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) val = 0;

    const items = prData.items.map(it => {
      if (it.id === itemId) {
        const amount = parseFloat((val * it.price).toFixed(2));
        return { ...it, returnQuantity: val, amount };
      }
      return it;
    });

    const totalQuantity = items.reduce((sum, it) => sum + it.returnQuantity, 0);
    const totalAmount = parseFloat(items.reduce((sum, it) => sum + it.amount, 0).toFixed(2));

    setPrData({
      ...prData,
      items,
      totalQuantity,
      totalAmount
    });
  };

  const handleRowRemarkChange = (itemId: string, remark: string) => {
    const items = prData.items.map(it => {
      if (it.id === itemId) {
        return { ...it, remark };
      }
      return it;
    });
    setPrData({ ...prData, items });
  };

  // 全局前端实时校验
  const validateForm = (isConfirmAction = false) => {
    const errs: Record<string, string> = {};

    if (isConfirmAction && !prData.returnReason.trim()) {
      errs.returnReason = '确认退货时，退货原因必填';
    }
    if (prData.returnReason.length > 200) {
      errs.returnReason = '退货原因最多不能超过 200 个字';
    }
    if (!prData.returnDate) {
      errs.returnDate = '退货日期必填';
    }

    // 检查是否有任何商品的退货数量非法或超出入库限制
    let hasQtyError = false;
    prData.items.forEach(it => {
      if (it.returnQuantity > it.receivedQuantity) {
        errs[`qty_${it.id}`] = '退货数量不能大于已入库数量';
        hasQtyError = true;
      }
      if (isConfirmAction && it.returnQuantity <= 0) {
        errs[`qty_${it.id}`] = '确认退货时退货数量必须大于 0';
        hasQtyError = true;
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 监听数据变化进行校验
  const hasValidationErrors = () => {
    // 实时检测明细数量超限
    for (const it of prData.items) {
      if (it.returnQuantity > it.receivedQuantity) return true;
      if (it.returnQuantity <= 0) return true; // 退货数量不可为0
    }
    if (prData.returnReason.length > 200) return true;
    return false;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    try {
      purchaseReturnApi.saveReturn(prData);
      alert('草稿保存成功');
      navigate('/purchase/returns');
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const handleConfirm = () => {
    if (!validateForm(true)) {
      alert('请检查并修复页面中的红色报错选项');
      return;
    }
    if (window.confirm('确认要正式提交退货申请吗？确认后单据将锁定。')) {
      try {
        purchaseReturnApi.confirmReturn(prData.id, prData);
        alert('确认退货成功，可开始安排下推退货出库');
        navigate(`/purchase/returns/${prData.id}`);
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
              {id ? '编辑采购退货单' : '从入库单下推创建采购退货单'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">单号：{prData.id}</p>
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
              <label className="font-semibold text-slate-500 block">来源入库单号</label>
              <div 
                onClick={() => navigate(`/purchase/receipts/${prData.sourceStockInId}`)}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex items-center font-mono font-bold text-primary hover:underline cursor-pointer"
              >
                {prData.sourceStockInId}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">供应商</label>
              <Input value={prData.supplierName} disabled className="bg-slate-50 border-slate-200 font-semibold" />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">仓库</label>
              <Input value={prData.warehouseName} disabled className="bg-slate-50 border-slate-200 font-semibold" />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">退货日期</label>
              <input
                type="date"
                value={prData.returnDate}
                onChange={e => {
                  setPrData({ ...prData, returnDate: e.target.value });
                  setErrors(prev => ({ ...prev, returnDate: '' }));
                }}
                className={`w-full rounded-md border ${
                  errors.returnDate ? 'border-rose-500 bg-rose-50/10' : 'border-input'
                } bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none`}
              />
              {errors.returnDate && <span className="text-[10px] text-rose-500 font-bold block">{errors.returnDate}</span>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-500 block">
                退货原因 <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={prData.returnReason}
                onChange={e => {
                  setPrData({ ...prData, returnReason: e.target.value });
                  setErrors(prev => ({ ...prev, returnReason: '' }));
                }}
                maxLength={200}
                placeholder="请详细描述退货原因，限 200 字（必填）"
                className={`w-full rounded-md border ${
                  errors.returnReason ? 'border-rose-500 bg-rose-50/10' : 'border-input'
                } px-3 py-2 text-xs text-slate-700 min-h-[50px] max-h-[120px] focus:outline-none`}
              />
              <div className="flex justify-between items-center mt-1 text-[10px]">
                {errors.returnReason ? (
                  <span className="text-rose-500 font-bold">{errors.returnReason}</span>
                ) : (
                  <span className="text-slate-400">请认真如实描述以作对账沟通依据</span>
                )}
                <span className={`${prData.returnReason.length > 200 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                  {prData.returnReason.length}/200
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 明细卡片 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">退货商品明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="p-3 w-36">商品编码</th>
                  <th className="p-3">商品名称</th>
                  <th className="p-3 w-32">规格型号</th>
                  <th className="p-3 w-16">单位</th>
                  <th className="p-3 text-right w-24">已入库数</th>
                  <th className="p-3 text-right w-28 text-primary">退货数量</th>
                  <th className="p-3 text-right w-24">单价</th>
                  <th className="p-3 text-right w-28">金额</th>
                  <th className="p-3 w-40">行备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {prData.items.map(it => {
                  const hasQtyErr = !!errors[`qty_${it.id}`] || it.returnQuantity > it.receivedQuantity || it.returnQuantity <= 0;

                  return (
                    <tr key={it.id} className="hover:bg-slate-50/20">
                      <td className="p-3 font-semibold text-slate-500">{it.productCode}</td>
                      <td className="p-3 font-semibold text-slate-800">{it.productName}</td>
                      <td className="p-3 text-slate-500">{it.productSpec}</td>
                      <td className="p-3 text-slate-400">{it.unit}</td>
                      {/* 已入库数量：只读 */}
                      <td className="p-3 text-right font-bold text-slate-400">
                        {it.receivedQuantity}
                      </td>
                      {/* 退货数量：编辑，强控不超过已入库，退货数必须大于0 */}
                      <td className="p-3 text-right">
                        <div className="inline-block w-24">
                          <input
                            type="number"
                            value={it.returnQuantity}
                            onChange={e => handleQtyChange(it.id, e.target.value)}
                            min={0}
                            className={`w-full text-right rounded border ${
                              hasQtyErr ? 'border-rose-500 bg-rose-50/15 text-rose-600' : 'border-input'
                            } px-2 py-1 text-xs font-bold focus:outline-none`}
                          />
                          {it.returnQuantity > it.receivedQuantity && (
                            <span className="text-[9px] text-rose-500 font-bold block text-right mt-0.5">
                              超已入库数!
                            </span>
                          )}
                          {it.returnQuantity <= 0 && (
                            <span className="text-[9px] text-rose-500 font-bold block text-right mt-0.5">
                              须大于0!
                            </span>
                          )}
                        </div>
                      </td>
                      {/* 单价：只读 */}
                      <td className="p-3 text-right font-bold text-slate-500">
                        ¥{it.price.toFixed(2)}
                      </td>
                      {/* 金额：自动算 */}
                      <td className="p-3 text-right font-extrabold text-slate-900">
                        ¥{it.amount.toFixed(2)}
                      </td>
                      {/* 行备注：编辑 */}
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
              <span>商品种数：<strong className="text-slate-800 font-black">{prData.itemCount}</strong> 种</span>
              <span className="ml-4">退货总数量：<strong className="text-slate-800 font-black">{prData.totalQuantity}</strong> 件</span>
            </div>
            <div className="text-sm">
              <span>退货总金额 (含税)：<strong className="text-rose-600 font-black text-base">¥{prData.totalAmount.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* 底部按钮栏：强控红字报错拦截，置灰确认按钮 */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {hasValidationErrors() ? (
              <span className="text-rose-500 font-extrabold flex items-center gap-1">
                <AlertCircle size={14} />
                存在超额退货或退货量小于等于0的异常数据，请修正后提交
              </span>
            ) : !prData.returnReason.trim() ? (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <AlertCircle size={14} />
                提示：确认退货必须输入退货原因
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">校验状态：数据符合退货强控规则</span>
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
              确认退货
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
