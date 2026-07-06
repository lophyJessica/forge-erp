import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { StockIn, StockInItem } from '../types/stockIn';
import { stockInApi } from '../api/stockIn';
import { purchaseOrderApi } from '../api/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft, AlertTriangle, CheckCircle, Save } from 'lucide-react';

export default function StockInForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const sourceId = searchParams.get('source_id');
  const isNewPush = location.pathname.includes('/new');

  // --- 表单状态 ---
  const [stockIn, setStockIn] = useState<StockIn | null>(null);
  const [stockInDate, setStockInDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<StockInItem[]>([]);

  // 校验错误信息（行级与整单）
  const [rowErrors, setRowErrors] = useState<Record<string, { received?: string; stockIn?: string }>>({});
  const [globalError, setGlobalError] = useState('');

  // 二次确认弹窗
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- 初始化加载 ---
  useEffect(() => {
    try {
      if (isNewPush && sourceId) {
        // 下推创建新单，并在 IndexedDB 存入草稿后，秒跳转到编辑态，防止刷新页面重复生成
        const draft = stockInApi.createStockInFromPO(sourceId);
        navigate(`/purchase/receipts/${draft.id}/edit`, { replace: true, state: { isFirstPush: true } });
      } else if (id) {
        const existing = stockInApi.getStockInById(id);
        if (existing) {
          if (existing.status !== 'DRAFT') {
            alert('只有草稿状态的入库单才可以编辑！');
            navigate(`/purchase/receipts/${existing.id}`);
            return;
          }
          setStockIn(existing);
          setStockInDate(existing.stockInDate);
          setRemark(existing.remark || '');
          setItems(existing.items);
        } else {
          alert('单据不存在');
          navigate('/purchase/receipts');
        }
      }
    } catch (err: any) {
      alert(err.message || '加载入库单失败');
      navigate('/purchase/receipts');
    }
  }, [id, isNewPush, sourceId]);

  // --- 实时联动与输入校验 ---
  const handleQtyChange = (
    itemId: string, 
    field: 'receivedQuantity' | 'stockInQuantity', 
    val: string
  ) => {
    const numVal = val === '' ? 0 : parseInt(val, 10);
    
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: numVal };

          // 联动规则：改实收时自动同步入库数量（若当前入库数量等于修改前的实收数量，或两者同步修改）
          if (field === 'receivedQuantity') {
            // 如果用户之前没修改过入库数量（两者依然相等），或者修改前两值相等，则自动同步
            if (item.stockInQuantity === item.receivedQuantity) {
              updatedItem.stockInQuantity = numVal;
            }
          }

          // 重新计算行含税金额
          updatedItem.amount = parseFloat((updatedItem.stockInQuantity * item.price).toFixed(2));
          return updatedItem;
        }
        return item;
      });
    });
  };

  const handleItemRemarkChange = (itemId: string, val: string) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, remark: val };
        }
        return item;
      });
    });
  };

  // --- 校验逻辑 ---
  useEffect(() => {
    const errors: Record<string, { received?: string; stockIn?: string }> = {};
    let hasGlobalBlock = false;

    items.forEach(item => {
      const itemErrors: { received?: string; stockIn?: string } = {};
      
      // 校验实收数量必填且为正整数
      if (item.receivedQuantity <= 0) {
        itemErrors.received = '必须是大于 0 的整数';
        hasGlobalBlock = true;
      }
      
      // 校验入库数量必填且为正整数
      if (item.stockInQuantity <= 0) {
        itemErrors.stockIn = '必须是大于 0 的整数';
        hasGlobalBlock = true;
      }

      // 强控1：实收数量 <= 订单未入库数量
      if (item.receivedQuantity > item.orderPendingQuantity) {
        itemErrors.received = `超收拦截：不能超过未入库数 ${item.orderPendingQuantity}`;
        hasGlobalBlock = true;
      }

      // 强控2：入库数量 <= 实收数量
      if (item.stockInQuantity > item.receivedQuantity) {
        itemErrors.stockIn = `不能大于实收数量 ${item.receivedQuantity}`;
        hasGlobalBlock = true;
      }

      if (Object.keys(itemErrors).length > 0) {
        errors[item.id] = itemErrors;
      }
    });

    setRowErrors(errors);
    
    // 入库日期校验
    if (!stockInDate) {
      setGlobalError('入库日期不能为空');
    } else if (new Date(stockInDate) > new Date()) {
      setGlobalError('入库日期不能晚于今天');
    } else if (hasGlobalBlock) {
      setGlobalError('明细行中存在数量校验错误，请修正后提交');
    } else {
      setGlobalError('');
    }
  }, [items, stockInDate]);

  // --- 保存草稿（宽松校验） ---
  const handleSaveDraft = () => {
    if (!stockIn) return;
    try {
      stockInApi.saveDraft(stockIn.id, {
        stockInDate,
        remark,
        items: items.map(it => ({
          id: it.id,
          receivedQuantity: it.receivedQuantity,
          stockInQuantity: it.stockInQuantity,
          remark: it.remark
        }))
      });
      alert('草稿保存成功！');
      navigate(`/purchase/receipts/${stockIn.id}`);
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  // --- 确认入库（全量校验） ---
  const handleConfirmSubmit = () => {
    if (!stockIn) return;
    if (globalError) {
      alert(globalError);
      return;
    }
    setShowConfirmModal(true);
  };

  const executeConfirmStockIn = () => {
    if (!stockIn) return;
    try {
      stockInApi.confirmStockIn(stockIn.id, {
        stockInDate,
        remark,
        items: items.map(it => ({
          id: it.id,
          receivedQuantity: it.receivedQuantity,
          stockInQuantity: it.stockInQuantity,
          remark: it.remark
        }))
      });
      setShowConfirmModal(false);
      alert('入库确认成功！现存库存已增加，应付账款已生成。');
      navigate(`/purchase/receipts/${stockIn.id}`);
    } catch (err: any) {
      alert(err.message || '确认失败');
    }
  };

  if (!stockIn) return <div className="p-8 text-center text-slate-400">正在初始化入库明细...</div>;

  const totalQty = items.reduce((sum, it) => sum + it.stockInQuantity, 0);
  const totalAmt = items.reduce((sum, it) => sum + it.amount, 0);
  const isFirstPush = location.state?.isFirstPush;

  return (
    <div className="space-y-4 pb-16">
      {/* 页头 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate('/purchase/receipts')} 
            className="p-1 hover:bg-slate-100 rounded cursor-pointer"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {isFirstPush ? '执行采购入库' : `编辑采购入库 ${stockIn.id}`}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              状态：<span className="font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">草稿</span>
            </p>
          </div>
        </div>
      </div>

      {/* 基本信息卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-400 block mb-1">来源采购单号</span>
            <span 
              onClick={() => navigate(`/purchase/orders/${stockIn.purchaseOrderId}`)}
              className="text-emerald-600 hover:underline font-bold cursor-pointer block py-1.5"
            >
              {stockIn.purchaseOrderId}
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400 block mb-1">供应商</span>
            <span className="font-bold text-slate-700 block py-1.5">{stockIn.supplierName}</span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400 block mb-1">入库仓库</span>
            <span className="font-bold text-slate-700 block py-1.5">{stockIn.warehouseName}</span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400 block mb-1">采购备注 (只读)</span>
            <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 min-h-[38px]">
              {stockIn.purchaseRemark || '无备注'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-400 block mb-1">入库日期 <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={stockInDate}
              onChange={e => setStockInDate(e.target.value)}
              className="rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-400 block mb-1">入库备注</label>
            <Textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="记录本次到货及收货的异常情况..."
              rows={2}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* 商品明细卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex justify-between items-center">
          <span>商品明细</span>
          <span className="text-xs text-slate-500 font-medium">
            共 {items.length} 种商品
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-40">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-36">商品条码</th>
                <th className="p-3 w-28">规格型号</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 text-right w-24 text-slate-400">订单数</th>
                <th className="p-3 text-right w-28 text-amber-600">未入库数</th>
                <th className="p-3 w-36 text-primary">实收数量 <span className="text-rose-500">*</span></th>
                <th className="p-3 w-36 text-primary">入库数量 <span className="text-rose-500">*</span></th>
                <th className="p-3 text-right w-28">单价 (含税)</th>
                <th className="p-3 text-right w-28">金额 (含税)</th>
                <th className="p-3">行备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {items.map((item, index) => {
                const err = rowErrors[item.id];
                return (
                  <tr key={item.id} className="hover:bg-slate-50/10">
                    <td className="p-3 text-slate-400 text-center">{index + 1}</td>
                    <td className="p-3 font-semibold text-slate-600">{item.productCode}</td>
                    <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                    <td className="p-3 text-slate-500">{item.productBarcode}</td>
                    <td className="p-3 text-slate-500">{item.productSpec}</td>
                    <td className="p-3 text-slate-500">{item.unit}</td>
                    <td className="p-3 text-right text-slate-400 font-medium">{item.orderQuantity}</td>
                    <td className="p-3 text-right text-amber-600 font-bold">{item.orderPendingQuantity}</td>
                    
                    {/* 实收数量输入框 */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={item.receivedQuantity || ''}
                          onChange={e => handleQtyChange(item.id, 'receivedQuantity', e.target.value)}
                          className={`h-8 text-xs font-bold ${err?.received ? 'border-rose-500 bg-rose-50/20' : ''}`}
                        />
                        {err?.received && (
                          <span className="text-[10px] text-rose-500 font-bold block">{err.received}</span>
                        )}
                      </div>
                    </td>

                    {/* 入库数量输入框 */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={item.stockInQuantity || ''}
                          onChange={e => handleQtyChange(item.id, 'stockInQuantity', e.target.value)}
                          className={`h-8 text-xs font-bold ${err?.stockIn ? 'border-rose-500 bg-rose-50/20' : ''}`}
                        />
                        {err?.stockIn && (
                          <span className="text-[10px] text-rose-500 font-bold block">{err.stockIn}</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-right text-slate-600 font-semibold">
                      ¥{item.price.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-slate-800 font-bold">
                      ¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">
                      <Input
                        value={item.remark || ''}
                        onChange={e => handleItemRemarkChange(item.id, e.target.value)}
                        placeholder="破损/质量..."
                        className="h-8 text-xs min-w-[100px]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 统计汇总区 */}
        <div className="bg-slate-50 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center text-xs gap-4 font-bold border border-slate-100">
          <div className="flex gap-4 text-slate-500">
            <span>商品种数：<span className="text-slate-800">{items.length} 种</span></span>
            <span>入库总数量：<span className="text-slate-800">{totalQty} 件</span></span>
          </div>
          <div className="text-base font-extrabold text-slate-800">
            入库总金额（含税）：
            <span className="text-rose-600 text-lg">
              ¥{totalAmt.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <Button
          variant="outline"
          onClick={() => {
            // 如果是刚下推的，需要删除这个刚建立的草稿，以免在列表页残留垃圾数据
            if (isFirstPush) {
              stockInApi.deleteStockIn(stockIn.id);
            }
            navigate('/purchase/receipts');
          }}
          className="h-9 px-4 text-xs font-bold"
        >
          返回列表
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="h-9 px-4 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 flex items-center gap-1"
          >
            <Save size={14} />
            保存草稿
          </Button>
          
          <div className="relative">
            <Button
              disabled={!!globalError}
              onClick={handleConfirmSubmit}
              className="h-9 px-5 text-xs font-bold bg-primary text-white flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle size={14} />
              确认入库
            </Button>
          </div>
        </div>
      </div>

      {/* 确认提交二次确认模态窗 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="text-amber-500" size={18} />
                确认入库生效
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                确认入库后实物将正式计入库存并形成应付，确认继续？
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="h-8 py-1"
              >
                取消
              </Button>
              <Button
                onClick={executeConfirmStockIn}
                className="h-8 py-1"
              >
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
