import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Edit3, FileText, Truck, XCircle } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesOrder, SalesOrderStatus, SalesOutbound } from '../types/sales';
import { Button } from '../components/ui/Button';

const STATUS_META: Record<SalesOrderStatus, { label: string; classes: string }> = {
  DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
  PENDING_AUDIT: { label: '待审核', classes: 'bg-orange-50 text-orange-700 border border-orange-200' },
  APPROVED: { label: '已审核', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  PARTIAL_OUTBOUND: { label: '部分出库', classes: 'bg-sky-50 text-sky-700 border border-sky-200' },
  COMPLETED: { label: '已完成', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
};

function StatusBadge({ status }: { status: SalesOrderStatus }) {
  const meta = STATUS_META[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${meta.classes}`}>{meta.label}</span>;
}

export default function SalesOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [outbounds, setOutbounds] = useState<SalesOutbound[]>([]);

  const loadData = () => {
    if (!id) return;
    const next = salesApi.getSalesOrderById(id);
    if (!next) {
      alert('销售订单不存在');
      navigate('/sales/orders');
      return;
    }
    setOrder(next);
    setOutbounds(salesApi.getOutboundsBySalesOrder(next.id));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!order) return <div className="p-8 text-center text-slate-400">加载中...</div>;

  const runAction = (label: string, fn: () => void) => {
    try {
      fn();
      alert(`${label}成功`);
      loadData();
    } catch (err: any) {
      alert(err.message || `${label}失败`);
    }
  };

  const createOutbound = () => {
    try {
      const draft = salesApi.createSalesOutboundFromSO(order.id);
      navigate(`/sales/outbounds/${draft.id}/edit`);
    } catch (err: any) {
      alert(err.message || '创建出库单失败');
    }
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales/orders')} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">销售订单 {order.id}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">审核通过只锁定占用库存，确认销售出库单时才扣减现存。</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/sales/orders')} className="font-bold">返回列表</Button>
          {order.status === 'DRAFT' && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/sales/orders/${order.id}/edit`)} className="gap-1 font-bold text-amber-600 border-amber-200">
                <Edit3 size={13} />
                编辑
              </Button>
              <Button size="sm" onClick={() => runAction('提交审核', () => salesApi.submitSalesOrder(order.id))} className="gap-1 font-bold">
                <Clock size={13} />
                提交审核
              </Button>
            </>
          )}
          {order.status === 'PENDING_AUDIT' && (
            <>
              <Button size="sm" onClick={() => runAction('审核', () => salesApi.approveSalesOrder(order.id))} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle size={13} />
                审核
              </Button>
              <Button variant="outline" size="sm" onClick={() => runAction('驳回', () => salesApi.rejectSalesOrder(order.id))} className="gap-1 font-bold text-orange-600 border-orange-200">
                <XCircle size={13} />
                驳回
              </Button>
              <Button variant="outline" size="sm" onClick={() => runAction('作废', () => salesApi.voidSalesOrder(order.id))} className="gap-1 font-bold text-rose-600 border-rose-200">
                <XCircle size={13} />
                作废
              </Button>
            </>
          )}
          {(order.status === 'APPROVED' || order.status === 'PARTIAL_OUTBOUND') && (
            <Button size="sm" onClick={createOutbound} className="gap-1 font-bold">
              <Truck size={13} />
              创建出库单
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <FileText size={16} className="text-slate-400" />
            基本信息
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Info label="客户" value={`${order.customerCode} ${order.customerName}`} />
            <Info label="价格等级" value={`${order.customerPriceLevel}批发价`} />
            <Info label="默认出库仓库" value={`${order.warehouseCode} ${order.warehouseName}`} />
            <Info label="下单日期" value={order.orderDate} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">制单信息</h3>
          <div className="text-xs space-y-3">
            <Info label="制单人" value={order.createdBy} />
            <Info label="制单时间" value={order.createdAt} />
            <Info label="审核人" value={order.approvedBy || '-'} />
            <Info label="审核时间" value={order.approvedAt || '-'} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">商品明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-32">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 w-24 text-right">订货数</th>
                <th className="p-3 w-24 text-right">已出库</th>
                <th className="p-3 w-24 text-right">待出库</th>
                <th className="p-3 w-28 text-right">售出价</th>
                <th className="p-3 w-32 text-right">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {order.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="p-3 text-center text-slate-400">{index + 1}</td>
                  <td className="p-3 font-semibold">{item.productCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-slate-500">{item.unit}</td>
                  <td className="p-3 text-right font-bold">{item.quantity}</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">{item.outboundQuantity}</td>
                  <td className="p-3 text-right text-primary font-bold">{item.pendingOutboundQuantity}</td>
                  <td className="p-3 text-right font-semibold">¥{item.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-extrabold">¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center text-xs font-bold border border-slate-100">
          <span>商品种数：{order.itemCount} 种</span>
          <span>销售总数量：{order.totalQuantity}</span>
          <span className="text-base">销售总金额：<span className="text-rose-600">¥{order.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <Truck size={16} className="text-indigo-500" />
          关联出库单
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {outbounds.map(outbound => (
            <Link key={outbound.id} to={`/sales/outbounds/${outbound.id}`} className="border border-slate-100 rounded-lg p-4 hover:border-primary/40 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-primary text-sm">{outbound.id}</span>
                <span className="text-xs text-slate-500">{outbound.outboundDate}</span>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-600 font-semibold">
                <span>{outbound.status === 'CONFIRMED' ? '已确认' : outbound.status === 'VOIDED' ? '已作废' : '草稿'}</span>
                <span>{outbound.totalQuantity} 件 · ¥{outbound.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
              </div>
            </Link>
          ))}
          {outbounds.length === 0 && <div className="text-xs text-slate-400">暂无关联出库单</div>}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="font-semibold text-slate-400 block">{label}</span>
      <span className="font-bold text-slate-700">{value}</span>
    </div>
  );
}
