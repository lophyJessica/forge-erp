import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PurchaseReturn } from '../types/purchaseReturn';
import { purchaseReturnApi } from '../api/purchaseReturn';
import { purchaseReturnOutboundApi } from '../api/purchaseReturnOutbound';
import { PurchaseReturnOutbound } from '../types/purchaseReturnOutbound';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, Edit3, CheckCircle, XCircle, Trash2, 
  ArrowUpRight, ClipboardList, Calendar, MapPin, 
  User, Check 
} from 'lucide-react';

export default function PurchaseReturnDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pr, setPr] = useState<PurchaseReturn | null>(null);
  const [outbounds, setOutbounds] = useState<PurchaseReturnOutbound[]>([]);

  // 二次确认
  const [confirmAction, setConfirmAction] = useState<{
    type: 'CONFIRM' | 'VOID' | 'DELETE' | null;
    title: string;
    msg: string;
  }>({ type: null, title: '', msg: '' });

  const loadData = () => {
    if (!id) return;
    const res = purchaseReturnApi.getReturnById(id);
    if (res) {
      setPr(res);
      // 加载下游退货出库单 PRO
      if (res.status === 'CONFIRMED') {
        const pros = purchaseReturnOutboundApi.getOutboundsByPR(res.id);
        setOutbounds(pros);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!pr) {
    return <div className="p-8 text-center text-slate-500 text-xs">加载退货单详情中...</div>;
  }

  // --- 动作处理 ---
  const handleAction = (type: 'CONFIRM' | 'VOID' | 'DELETE') => {
    try {
      if (type === 'CONFIRM') {
        purchaseReturnApi.confirmReturn(pr.id);
        alert('确认退货成功，可下推退货出库');
      } else if (type === 'VOID') {
        purchaseReturnApi.voidReturn(pr.id);
        alert('退货单已成功作废');
      } else if (type === 'DELETE') {
        purchaseReturnApi.deleteReturn(pr.id);
        alert('草稿退货单已成功物理删除');
        navigate('/purchase/returns');
        return;
      }
      loadData();
      setConfirmAction({ type: null, title: '', msg: '' });
    } catch (e: any) {
      alert(e.message || '操作失败');
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 页头 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/purchase/returns')}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800">采购退货单详情</h1>
              <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                pr.status === 'DRAFT' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : pr.status === 'CONFIRMED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {pr.status === 'DRAFT' ? '草稿' : pr.status === 'CONFIRMED' ? '已确认' : '已作废'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">单号：{pr.id}</p>
          </div>
        </div>

        {/* 顶部主操作区 */}
        <div className="flex gap-2">
          {pr.status === 'DRAFT' && (
            <>
              <Button 
                size="sm" 
                onClick={() => navigate(`/purchase/returns/${pr.id}/edit`)} 
                className="h-8 py-1 flex items-center gap-1 font-bold text-amber-600 border-amber-200 hover:bg-amber-50"
                variant="outline"
              >
                <Edit3 size={13} />
                编辑草稿
              </Button>

              <Button 
                size="sm" 
                onClick={() => setConfirmAction({
                  type: 'CONFIRM',
                  title: '确认退货单',
                  msg: '确认后退货单将被锁定，正式转入库房退货出库执行状态。确认继续？'
                })}
                className="h-8 py-1 flex items-center gap-1 font-bold"
              >
                <CheckCircle size={13} />
                确认退货
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({
                  type: 'VOID',
                  title: '作废退货单',
                  msg: '作废后该退货单将失效无法再做出库操作，确认继续？'
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
                  title: '物理删除退货单',
                  msg: '删除后数据将彻底消失且不可找回。确认物理删除此草稿单？'
                })} 
                className="h-8 py-1 flex items-center gap-1 text-slate-400 hover:text-slate-600 border-slate-200 font-bold"
              >
                <Trash2 size={13} />
                物理删除
              </Button>
            </>
          )}

          {/* 已确认：下推退货出库 */}
          {pr.status === 'CONFIRMED' && (
            <Button 
              size="sm" 
              onClick={() => navigate(`/purchase/return-outbounds/new?source_id=${pr.id}`)}
              className="h-8 py-1 flex items-center gap-1 font-bold bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowUpRight size={13} />
              下推退货出库
            </Button>
          )}
        </div>
      </div>

      {/* 状态时间线 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-bold text-slate-500">
          <div className="flex flex-col items-center gap-1.5 relative flex-1">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">1</span>
            <span className="text-emerald-600">下推创建 (草稿)</span>
            <span className="text-[10px] text-slate-400 font-normal mt-0.5">{pr.createdAt}</span>
            <div className="absolute right-0 top-3 h-0.5 bg-slate-200 w-1/2 translate-x-1/2 -z-10" />
          </div>

          <div className="flex flex-col items-center gap-1.5 relative flex-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
              pr.status !== 'DRAFT' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {pr.status === 'VOIDED' ? '✕' : '2'}
            </span>
            <span className={pr.status === 'CONFIRMED' ? 'text-primary' : pr.status === 'VOIDED' ? 'text-rose-600' : 'text-slate-400'}>
              {pr.status === 'VOIDED' ? '单据已作废' : '确认退货'}
            </span>
            {pr.confirmedAt && <span className="text-[10px] text-slate-400 font-normal mt-0.5">{pr.confirmedAt}</span>}
            {pr.status === 'VOIDED' && pr.updatedAt && <span className="text-[10px] text-slate-400 font-normal mt-0.5">{pr.updatedAt}</span>}
            <div className="absolute right-0 top-3 h-0.5 bg-slate-200 w-1/2 translate-x-1/2 -z-10" />
          </div>

          <div className="flex flex-col items-center gap-1.5 relative flex-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
              outbounds.some(o => o.status === 'CONFIRMED') ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              3
            </span>
            <span className={outbounds.some(o => o.status === 'CONFIRMED') ? 'text-emerald-600' : 'text-slate-400'}>
              已退货出库
            </span>
          </div>
        </div>
      </div>

      {/* 主信息区 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 基本信息栏 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">基本信息</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <ClipboardList size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">来源入库单号</p>
                <Link to={`/purchase/receipts/${pr.sourceStockInId}`} className="font-mono font-extrabold text-primary hover:underline mt-1 block">
                  {pr.sourceStockInId}
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">供应商</p>
                <p className="font-bold mt-1 text-slate-800">{pr.supplierName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">仓库</p>
                <p className="font-bold mt-1 text-slate-800">{pr.warehouseName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">退货日期</p>
                <p className="font-bold mt-1 text-slate-800">{pr.returnDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <ClipboardList size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">退货原因</p>
                <p className="font-semibold text-rose-600 bg-rose-50/30 p-2.5 rounded-md border border-rose-100/50 mt-1 leading-relaxed whitespace-pre-wrap max-w-xl">
                  {pr.returnReason || '未填写退货原因'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 明细表格卡片 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-3">
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
                {pr.items.map(it => (
                  <tr key={it.id} className="hover:bg-slate-50/20">
                    <td className="p-3 font-semibold text-slate-500">{it.productCode}</td>
                    <td className="p-3 font-semibold text-slate-800">{it.productName}</td>
                    <td className="p-3 text-slate-500">{it.productSpec}</td>
                    <td className="p-3 text-slate-400">{it.unit}</td>
                    <td className="p-3 text-right font-bold text-slate-400">{it.receivedQuantity}</td>
                    <td className="p-3 text-right font-extrabold text-primary">{it.returnQuantity}</td>
                    <td className="p-3 text-right font-bold text-slate-500">¥{it.price.toFixed(2)}</td>
                    <td className="p-3 text-right font-extrabold text-slate-900">¥{it.amount.toFixed(2)}</td>
                    <td className="p-3 text-slate-500 italic">{it.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 汇总 */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 pt-4 text-xs font-bold text-slate-600 bg-slate-50/50 p-4 rounded-lg gap-2">
            <div>
              <span>商品种数：<strong className="text-slate-800 font-black">{pr.itemCount}</strong> 种</span>
              <span className="ml-4">退货总数量：<strong className="text-slate-800 font-black">{pr.totalQuantity}</strong> 件</span>
            </div>
            <div className="text-sm">
              <span>退货总金额 (含税)：<strong className="text-rose-600 font-black text-base">¥{pr.totalAmount.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* 关联下游 PRO 出库单列表 */}
        {pr.status === 'CONFIRMED' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-3">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <ArrowUpRight size={16} className="text-indigo-600" />
              关联退货出库单 (PRO)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                    <th className="p-2">出库单号</th>
                    <th className="p-2">出库日期</th>
                    <th className="p-2 text-right w-28">出库总数量</th>
                    <th className="p-2 text-right w-32">出库总金额</th>
                    <th className="p-2 text-center w-24">单据状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {outbounds.length > 0 ? (
                    outbounds.map(pro => (
                      <tr key={pro.id} className="hover:bg-slate-50/20">
                        <td className="p-2 font-mono font-semibold">
                          <Link to={`/purchase/return-outbounds/${pro.id}`} className="text-primary hover:underline font-bold">
                            {pro.id}
                          </Link>
                        </td>
                        <td className="p-2 font-medium text-slate-500">{pro.outboundDate}</td>
                        <td className="p-2 text-right font-bold">{pro.totalQuantity}</td>
                        <td className="p-2 text-right font-extrabold text-slate-800">¥{pro.totalAmount.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            pro.status === 'DRAFT' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : pro.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {pro.status === 'DRAFT' ? '草稿' : pro.status === 'CONFIRMED' ? '已确认' : '已作废'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        暂无关联退货出库执行单据，可点击右上角“下推退货出库”发起发货。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 二次确认框 */}
      {confirmAction.type && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                {confirmAction.type === 'CONFIRM' && <CheckCircle className="text-emerald-500" size={18} />}
                {confirmAction.type === 'VOID' && <XCircle className="text-rose-500" size={18} />}
                {confirmAction.type === 'DELETE' && <Trash2 className="text-slate-400" size={18} />}
                {confirmAction.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {confirmAction.msg}
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <Button variant="outline" onClick={() => setConfirmAction({ type: null, title: '', msg: '' })} className="h-8 py-1">
                取消
              </Button>
              <Button
                variant={confirmAction.type === 'CONFIRM' ? 'default' : 'destructive'}
                onClick={() => handleAction(confirmAction.type!)}
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
