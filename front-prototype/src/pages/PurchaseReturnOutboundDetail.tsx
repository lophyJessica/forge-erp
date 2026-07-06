import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PurchaseReturnOutbound } from '../types/purchaseReturnOutbound';
import { purchaseReturnOutboundApi } from '../api/purchaseReturnOutbound';
import { stockInApi } from '../api/stockIn';
import { InventoryFlow } from '../types/stockIn';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, Edit3, CheckCircle, XCircle, Trash2, 
  ArrowDownLeft, ClipboardList, Calendar, MapPin, 
  User, Link2 
} from 'lucide-react';

export default function PurchaseReturnOutboundDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [pro, setPro] = useState<PurchaseReturnOutbound | null>(null);
  const [flows, setFlows] = useState<InventoryFlow[]>([]);
  const [payables, setPayables] = useState<any[]>([]);

  // 二次确认
  const [confirmAction, setConfirmAction] = useState<{
    type: 'CONFIRM' | 'VOID' | 'DELETE' | null;
    title: string;
    msg: string;
  }>({ type: null, title: '', msg: '' });

  const loadData = () => {
    if (!id) return;
    const res = purchaseReturnOutboundApi.getOutboundById(id);
    if (res) {
      setPro(res);
      // 加载关联下游记录
      if (res.status === 'CONFIRMED') {
        setFlows(stockInApi.getInventoryFlows(res.id));
        setPayables(stockInApi.getPayableRecords(res.id));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!pro) {
    return <div className="p-8 text-center text-slate-500 text-xs">加载退货出库单详情中...</div>;
  }

  const handleAction = (type: 'CONFIRM' | 'VOID' | 'DELETE') => {
    try {
      if (type === 'CONFIRM') {
        purchaseReturnOutboundApi.confirmOutbound(pro.id);
        alert('出库成功，库存及账款已更新');
      } else if (type === 'VOID') {
        purchaseReturnOutboundApi.voidOutbound(pro.id);
        alert('该出库单已成功作废');
      } else if (type === 'DELETE') {
        purchaseReturnOutboundApi.deleteOutbound(pro.id);
        alert('出库单草稿已物理删除');
        navigate('/purchase/return-outbounds');
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
            onClick={() => navigate('/purchase/return-outbounds')}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800">采购退货出库单详情</h1>
              <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                pro.status === 'DRAFT' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : pro.status === 'CONFIRMED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {pro.status === 'DRAFT' ? '草稿' : pro.status === 'CONFIRMED' ? '已确认' : '已作废'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">单号：{pro.id}</p>
          </div>
        </div>

        {/* 顶部操作区 */}
        <div className="flex gap-2">
          {pro.status === 'DRAFT' && (
            <>
              <Button 
                size="sm" 
                onClick={() => navigate(`/purchase/return-outbounds/${pro.id}/edit`)} 
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
                  title: '确认发货出库',
                  msg: '确认出库后将正式冲扣即时库存、更新财务账目。确认发货？'
                })}
                className="h-8 py-1 flex items-center gap-1 font-bold"
              >
                <CheckCircle size={13} />
                确认出库
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({
                  type: 'VOID',
                  title: '作废出库单',
                  msg: '作废后出库单将无法做出库操作，确认继续？'
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
                  title: '物理删除草稿',
                  msg: '确认删除该退货出库单草稿？删除后不可恢复。'
                })} 
                className="h-8 py-1 flex items-center gap-1 text-slate-400 hover:text-slate-600 border-slate-200 font-bold"
              >
                <Trash2 size={13} />
                物理删除
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 状态时间轴 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center justify-between max-w-xl mx-auto text-xs font-bold text-slate-500">
          <div className="flex flex-col items-center gap-1.5 relative flex-1">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">1</span>
            <span className="text-emerald-600">下推创建 (草稿)</span>
            <span className="text-[10px] text-slate-400 font-normal mt-0.5">{pro.createdAt}</span>
            <div className="absolute right-0 top-3 h-0.5 bg-slate-200 w-1/2 translate-x-1/2 -z-10" />
          </div>

          <div className="flex flex-col items-center gap-1.5 relative flex-1">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
              pro.status !== 'DRAFT' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {pro.status === 'VOIDED' ? '✕' : '2'}
            </span>
            <span className={pro.status === 'CONFIRMED' ? 'text-emerald-600 font-bold' : pro.status === 'VOIDED' ? 'text-rose-600' : 'text-slate-400'}>
              {pro.status === 'VOIDED' ? '单据已作废' : '确认出库'}
            </span>
            {pro.confirmedAt && <span className="text-[10px] text-slate-400 font-normal mt-0.5">{pro.confirmedAt}</span>}
          </div>
        </div>
      </div>

      {/* 信息展示区 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 基本信息栏 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">基本信息</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <Link2 size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">来源退货单号</p>
                <Link to={`/purchase/returns/${pro.sourceReturnId}`} className="font-mono font-extrabold text-primary hover:underline mt-1 block">
                  {pro.sourceReturnId}
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">供应商</p>
                <p className="font-bold mt-1 text-slate-800">{pro.supplierName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">出库仓库</p>
                <p className="font-bold mt-1 text-slate-800">{pro.warehouseName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">出库日期</p>
                <p className="font-bold mt-1 text-slate-800">{pro.outboundDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:col-span-2">
              <ClipboardList size={16} className="text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-400 font-medium">出库备注</p>
                <p className="font-semibold text-slate-700 bg-slate-50/50 p-2.5 rounded-md border border-slate-200/50 mt-1 leading-relaxed whitespace-pre-wrap max-w-xl">
                  {pro.remark || '无出库备注说明'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 明细 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-3">
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
                {pro.items.map(it => (
                  <tr key={it.id} className="hover:bg-slate-50/20">
                    <td className="p-3 font-semibold text-slate-500">{it.productCode}</td>
                    <td className="p-3 font-semibold text-slate-800">{it.productName}</td>
                    <td className="p-3 text-slate-500">{it.productSpec}</td>
                    <td className="p-3 text-slate-400">{it.unit}</td>
                    <td className="p-3 text-right font-bold text-slate-400">{it.returnQuantity}</td>
                    <td className="p-3 text-right font-extrabold text-primary">{it.outboundQuantity}</td>
                    <td className="p-3 text-right font-bold text-slate-500">¥{it.price.toFixed(2)}</td>
                    <td className="p-3 text-right font-extrabold text-slate-900">¥{it.amount.toFixed(2)}</td>
                    <td className="p-3 text-slate-550 italic">{it.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 汇总 */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 pt-4 text-xs font-bold text-slate-600 bg-slate-50/50 p-4 rounded-lg gap-2">
            <div>
              <span>商品种数：<strong className="text-slate-800 font-black">{pro.itemCount}</strong> 种</span>
              <span className="ml-4">出库总数量：<strong className="text-slate-800 font-black">{pro.totalQuantity}</strong> 件</span>
            </div>
            <div className="text-sm">
              <span>出库总金额 (含税)：<strong className="text-rose-600 font-black text-base">¥{pro.totalAmount.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* 关联下游数据（已确认状态） */}
        {pro.status === 'CONFIRMED' && (
          <>
            {/* 库存流水 FL */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-3">
              <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <ArrowDownLeft size={16} className="text-emerald-500" />
                关联库存发货流水 (FL)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                      <th className="p-2">流水号</th>
                      <th className="p-2">发生时间</th>
                      <th className="p-2">商品编码</th>
                      <th className="p-2">商品名称</th>
                      <th className="p-2 text-right w-24">发货数量</th>
                      <th className="p-2 text-right w-24">变动后现存</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {flows.length > 0 ? (
                      flows.map(fl => (
                        <tr key={fl.id} className="hover:bg-slate-50/20">
                          <td className="p-2 font-mono font-semibold text-slate-500">{fl.id}</td>
                          <td className="p-2 text-slate-400 font-medium">{fl.createdAt}</td>
                          <td className="p-2 font-semibold text-slate-500">{fl.productCode}</td>
                          <td className="p-2 font-semibold">{fl.productName}</td>
                          <td className="p-2 text-right font-extrabold text-slate-900">{fl.quantity}</td>
                          <td className="p-2 text-right font-bold text-slate-600">{fl.postQuantity}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          暂无关联库存流水记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 应付账款冲减 AP */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-3">
              <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                <ArrowDownLeft size={16} className="text-rose-500" />
                关联应付款冲减 (AP)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                      <th className="p-2">应付号</th>
                      <th className="p-2">供应商</th>
                      <th className="p-2 text-right w-28">冲减金额</th>
                      <th className="p-2 text-center w-24">结算状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payables.length > 0 ? (
                      payables.map(ap => (
                        <tr key={ap.id} className="hover:bg-slate-50/20">
                          <td className="p-2 font-mono font-semibold text-slate-500">{ap.id}</td>
                          <td className="p-2 font-semibold">{ap.supplierName}</td>
                          <td className="p-2 text-right font-extrabold text-emerald-600">
                            ¥{ap.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                              已冲减对账
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          暂无关联应付对账记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 二次确认对话框 */}
      {confirmAction.type && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4">
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
