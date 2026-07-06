import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StockIn, StockInStatus } from '../types/stockIn';
import { stockInApi } from '../api/stockIn';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, CheckCircle, XCircle, Trash2, Edit3, 
  ArrowUpRight, Clock, FileText, ExternalLink
} from 'lucide-react';

export default function StockInDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // --- 状态定义 ---
  const [stockIn, setStockIn] = useState<StockIn | null>(null);
  const [inventoryFlows, setInventoryFlows] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);

  // 弹窗控制
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE' | 'VOID' | 'CONFIRM' | null;
    title: string;
    msg: string;
  }>({ type: null, title: '', msg: '' });

  // --- 数据加载 ---
  const loadData = () => {
    if (!id) return;
    const res = stockInApi.getStockInById(id);
    if (res) {
      setStockIn(res);
      // 加载关联的库存流水和应付记录
      setInventoryFlows(stockInApi.getInventoryFlows(res.id));
      setPayables(stockInApi.getPayableRecords(res.id));
    } else {
      alert('入库单不存在');
      navigate('/purchase/receipts');
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!stockIn) return <div className="p-8 text-center text-slate-400">加载中...</div>;

  // 状态 Badge
  const getStatusBadge = (status: StockInStatus) => {
    const config: Record<StockInStatus, { label: string; classes: string }> = {
      DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
      CONFIRMED: { label: '已确认', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
    };
    const item = config[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${item.classes}`}>
        {item.label}
      </span>
    );
  };

  // 状态流转操作
  const handleAction = (actionType: typeof confirmAction['type']) => {
    if (!stockIn) return;
    try {
      if (actionType === 'DELETE') {
        stockInApi.deleteStockIn(stockIn.id);
        alert('入库单已物理删除');
        navigate('/purchase/receipts');
      } else if (actionType === 'VOID') {
        stockInApi.voidStockIn(stockIn.id);
        alert('入库单已成功作废');
        loadData();
      } else if (actionType === 'CONFIRM') {
        stockInApi.confirmStockIn(stockIn.id);
        alert('确认入库成功，库存已更新，应付款已生成');
        loadData();
      }
      setConfirmAction({ type: null, title: '', msg: '' });
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  // 渲染时间线
  const getTimelineSteps = () => {
    const steps = [
      { 
        label: '下推创建草稿', 
        active: true, 
        time: stockIn.createdAt, 
        user: stockIn.createdBy 
      },
    ];

    if (stockIn.status === 'VOIDED') {
      steps.push({
        label: '单据已作废',
        active: true,
        time: stockIn.updatedAt || '',
        user: stockIn.updatedBy || ''
      });
    } else {
      steps.push({
        label: '收货确认生效',
        active: stockIn.status === 'CONFIRMED',
        time: stockIn.confirmedAt || '',
        user: stockIn.confirmedBy || ''
      });
    }

    return steps;
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 页头标题 + 动态按钮 */}
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/purchase/receipts')} 
            className="p-1 hover:bg-slate-100 rounded cursor-pointer"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">采购入库单 {stockIn.id}</h1>
              {getStatusBadge(stockIn.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              来源采购订单：
              <span 
                onClick={() => navigate(`/purchase/orders/${stockIn.purchaseOrderId}`)}
                className="font-semibold text-emerald-600 hover:underline cursor-pointer"
              >
                {stockIn.purchaseOrderId}
              </span>
            </p>
          </div>
        </div>

        {/* 动态按钮组 */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/purchase/receipts')} 
            className="h-8 py-1 font-bold"
          >
            返回列表
          </Button>

          {/* 草稿状态操作 */}
          {stockIn.status === 'DRAFT' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/purchase/receipts/${stockIn.id}/edit`)} 
                className="h-8 py-1 flex items-center gap-1 font-bold text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Edit3 size={13} />
                编辑草稿
              </Button>

              <Button 
                size="sm" 
                onClick={() => setConfirmAction({
                  type: 'CONFIRM',
                  title: '确认入库',
                  msg: '确认入库后实物将正式计入库存并形成应付，确认继续？'
                })}
                className="h-8 py-1 flex items-center gap-1 font-bold"
              >
                <CheckCircle size={13} />
                确认入库
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({
                  type: 'VOID',
                  title: '作废入库单',
                  msg: '作废后该入库单将永久失效，确认作废？'
                })} 
                className="h-8 py-1 flex items-center gap-1 text-rose-600 hover:text-rose-700 border-rose-200 font-bold"
              >
                <XCircle size={13} />
                作废
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({
                  type: 'DELETE',
                  title: '删除入库单',
                  msg: '删除后不可恢复，确认删除该草稿入库单？'
                })} 
                className="h-8 py-1 flex items-center gap-1 text-slate-400 hover:text-slate-600 border-slate-200 font-bold"
              >
                <Trash2 size={13} />
                物理删除
              </Button>
            </>
          )}

          {/* 已确认状态操作 */}
          {stockIn.status === 'CONFIRMED' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/purchase/returns/new?source_id=${stockIn.id}`)}
              className="h-8 py-1 flex items-center gap-1 text-indigo-600 hover:text-indigo-700 border-indigo-200 font-bold"
            >
              <ArrowUpRight size={13} />
              创建退货单
            </Button>
          )}
        </div>
      </div>

      {/* 状态时间线 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <Clock size={16} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">处理进度时间线</h3>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 text-xs font-semibold pl-4">
          {getTimelineSteps().map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 relative">
              {/* 圆圈 */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 ${
                step.active 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {idx + 1}
              </div>

              {/* 描述 */}
              <div>
                <p className={`font-bold ${step.active ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                {step.time && (
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {step.time.split(' ')[0]} ({step.user})
                  </p>
                )}
              </div>

              {/* 连接线 */}
              {idx < getTimelineSteps().length - 1 && (
                <div className="hidden md:block absolute left-full ml-4 w-8 h-0.5 bg-slate-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 两个并排卡片：基本信息 + 备注 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 左侧基本信息 (占比2/3) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <FileText size={16} className="text-slate-400" />
            基本信息
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 block">来源采购单号</span>
              <span 
                onClick={() => navigate(`/purchase/orders/${stockIn.purchaseOrderId}`)}
                className="font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                {stockIn.purchaseOrderId}
                <ExternalLink size={11} />
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 block">供应商</span>
              <span className="font-bold text-slate-700">{stockIn.supplierName}</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 block">入库仓库</span>
              <span className="font-bold text-slate-700">{stockIn.warehouseName}</span>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 block">入库日期</span>
              <span className="font-bold text-slate-700">{stockIn.stockInDate}</span>
            </div>
          </div>
        </div>

        {/* 右侧备注信息 (占比1/3) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">备注说明</h3>
          <div className="text-xs space-y-3">
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 block">采购备注 (来自采购订单)</span>
              <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                {stockIn.purchaseRemark || '无备注'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 block">收货备注</span>
              <p className="text-slate-600 bg-slate-50/50 p-2.5 rounded border border-dashed border-slate-200 leading-relaxed font-medium">
                {stockIn.remark || '无收货备注'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 商品明细列表卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">商品明细清单</h3>
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
                <th className="p-3 text-right w-24 text-slate-400">订单数量</th>
                <th className="p-3 text-right w-28 text-slate-400">未入库数</th>
                <th className="p-3 text-right w-28 text-emerald-600">实收数量</th>
                <th className="p-3 text-right w-28 text-primary">入库数量</th>
                <th className="p-3 text-right w-28">单价 (含税)</th>
                <th className="p-3 text-right w-28">金额 (含税)</th>
                <th className="p-3">行备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {stockIn.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/20">
                  <td className="p-3 text-slate-400 text-center">{index + 1}</td>
                  <td className="p-3 font-semibold text-slate-600">{item.productCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productBarcode}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-slate-500">{item.unit}</td>
                  <td className="p-3 text-right text-slate-400 font-medium">{item.orderQuantity}</td>
                  <td className="p-3 text-right text-slate-400 font-medium">{item.orderPendingQuantity}</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">{item.receivedQuantity}</td>
                  <td className="p-3 text-right text-primary font-bold">{item.stockInQuantity}</td>
                  <td className="p-3 text-right text-slate-600 font-semibold">¥{item.price.toFixed(2)}</td>
                  <td className="p-3 text-right text-slate-800 font-extrabold">
                    ¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-slate-500 italic">{item.remark || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 统计汇总区 */}
        <div className="bg-slate-50 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center text-xs gap-4 font-bold border border-slate-100">
          <div className="flex gap-4 text-slate-500">
            <span>商品种数：<span className="text-slate-800">{stockIn.items.length} 种</span></span>
            <span>入库总数量：<span className="text-slate-800">{stockIn.totalQuantity} 件</span></span>
          </div>
          <div className="text-base font-extrabold text-slate-800">
            入库总金额（含税）：
            <span className="text-rose-600 text-lg">
              ¥{stockIn.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 关联下游单据 (仅在已确认状态下显示) */}
      {stockIn.status === 'CONFIRMED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 关联库存流水卡片 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <ArrowUpRight size={16} className="text-emerald-500" />
              关联库存流水 (FL)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                    <th className="p-2">流水号</th>
                    <th className="p-2">商品</th>
                    <th className="p-2 w-20">方向</th>
                    <th className="p-2 text-right w-24">数量</th>
                    <th className="p-2 w-28">发生时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inventoryFlows.length > 0 ? (
                    inventoryFlows.map(flow => (
                      <tr key={flow.id} className="hover:bg-slate-50/20">
                        <td className="p-2 font-mono font-semibold text-slate-500">{flow.id}</td>
                        <td className="p-2 font-semibold">[{flow.productCode}] {flow.productName}</td>
                        <td className="p-2">
                          <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold">
                            增加 (+入库)
                          </span>
                        </td>
                        <td className="p-2 text-right font-extrabold text-emerald-600">+{flow.quantity} 件</td>
                        <td className="p-2 text-slate-400 font-medium">{flow.createdAt.split(' ')[1]}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        暂无库存流水记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 关联应付账款卡片 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <ArrowUpRight size={16} className="text-rose-500" />
              关联应付账款 (AP)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                    <th className="p-2">应付号</th>
                    <th className="p-2">供应商</th>
                    <th className="p-2 text-right w-28">应付金额</th>
                    <th className="p-2 text-center w-24">付款状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payables.length > 0 ? (
                    payables.map(ap => (
                      <tr key={ap.id} className="hover:bg-slate-50/20">
                        <td className="p-2 font-mono font-semibold text-slate-500">{ap.id}</td>
                        <td className="p-2 font-semibold">{ap.supplierName}</td>
                        <td className="p-2 text-right font-extrabold text-rose-600">
                          ¥{ap.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold">
                            待付款
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        暂无应收应付关联记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗二次确认 */}
      {confirmAction.type && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                {confirmAction.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {confirmAction.msg}
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmAction({ type: null, title: '', msg: '' })}
                className="h-8 py-1"
              >
                取消
              </Button>
              <Button
                variant={confirmAction.type === 'CONFIRM' ? 'default' : 'destructive'}
                onClick={() => handleAction(confirmAction.type)}
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
