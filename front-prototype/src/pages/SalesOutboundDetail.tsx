import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Edit3, ExternalLink, FileText, ReceiptText, RotateCcw, XCircle } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesOutbound, SalesOutboundStatus } from '../types/sales';
import type { InventoryFlow } from '../types/stockIn';
import type { AccountReceivable } from '../db';
import { Button } from '../components/ui/Button';

const STATUS_META: Record<SalesOutboundStatus, { label: string; classes: string }> = {
  DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
  CONFIRMED: { label: '已确认', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
};

function StatusBadge({ status }: { status: SalesOutboundStatus }) {
  const meta = STATUS_META[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${meta.classes}`}>{meta.label}</span>;
}

export default function SalesOutboundDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [outbound, setOutbound] = useState<SalesOutbound | null>(null);
  const [flows, setFlows] = useState<InventoryFlow[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);

  const loadData = () => {
    if (!id) return;
    const next = salesApi.getSalesOutboundById(id);
    if (!next) {
      alert('销售出库单不存在');
      navigate('/sales/outbounds');
      return;
    }
    setOutbound(next);
    setFlows(salesApi.getInventoryFlows(next.id));
    setReceivables(salesApi.getReceivableRecords(next.id));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!outbound) return <div className="p-8 text-center text-slate-400">加载中...</div>;

  const runAction = (label: string, fn: () => void) => {
    try {
      fn();
      alert(`${label}成功`);
      loadData();
    } catch (err: any) {
      alert(err.message || `${label}失败`);
    }
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales/outbounds')} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">销售出库单 {outbound.id}</h1>
              <StatusBadge status={outbound.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              来源销售订单：
              <Link to={`/sales/orders/${outbound.salesOrderId}`} className="font-mono font-bold text-primary hover:underline ml-1">
                {outbound.salesOrderId}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/sales/outbounds')} className="font-bold">返回列表</Button>
          {outbound.status === 'DRAFT' && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/sales/outbounds/${outbound.id}/edit`)} className="gap-1 font-bold text-amber-600 border-amber-200">
                <Edit3 size={13} />
                编辑
              </Button>
              <Button size="sm" onClick={() => runAction('确认出库', () => salesApi.confirmSalesOutbound(outbound.id))} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle size={13} />
                确认出库
              </Button>
              <Button variant="outline" size="sm" onClick={() => runAction('作废', () => salesApi.voidSalesOutbound(outbound.id))} className="gap-1 font-bold text-rose-600 border-rose-200">
                <XCircle size={13} />
                作废
              </Button>
            </>
          )}
          {outbound.status === 'CONFIRMED' && (
            <Button size="sm" onClick={() => navigate(`/sales/returns/new?source_id=${outbound.id}`)} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700">
              <RotateCcw size={13} />
              创建退货单
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
            <Info label="来源 SO">
              <Link to={`/sales/orders/${outbound.salesOrderId}`} className="font-mono text-primary hover:underline flex items-center gap-1">
                {outbound.salesOrderId}
                <ExternalLink size={11} />
              </Link>
            </Info>
            <Info label="客户">{outbound.customerName}</Info>
            <Info label="仓库">{outbound.warehouseName}</Info>
            <Info label="出库日期">{outbound.outboundDate}</Info>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">制单信息</h3>
          <div className="text-xs space-y-3">
            <Info label="制单人">{outbound.createdBy}</Info>
            <Info label="制单时间">{outbound.createdAt}</Info>
            <Info label="确认人">{outbound.confirmedBy || '-'}</Info>
            <Info label="确认时间">{outbound.confirmedAt || '-'}</Info>
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
                <th className="p-3 w-28">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-24 text-right">应出数量</th>
                <th className="p-3 w-24 text-right">实出数量</th>
                <th className="p-3 w-28 text-right">单价</th>
                <th className="p-3 w-32 text-right">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {outbound.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="p-3 text-center text-slate-400">{index + 1}</td>
                  <td className="p-3 font-semibold">{item.productCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-right text-primary font-bold">{item.orderPendingQuantity}</td>
                  <td className="p-3 text-right text-emerald-600 font-bold">{item.outboundQuantity}</td>
                  <td className="p-3 text-right font-semibold">¥{item.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-extrabold">¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center text-xs font-bold border border-slate-100">
          <span>商品种数：{outbound.itemCount}</span>
          <span>实出总数量：{outbound.totalQuantity}</span>
          <span className="text-base">出库金额：<span className="text-rose-600">¥{outbound.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></span>
        </div>
      </div>

      {outbound.status === 'CONFIRMED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">关联库存流水 (FL)</h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50 text-slate-500"><th className="p-2">流水号</th><th className="p-2">商品</th><th className="p-2 text-right">数量</th><th className="p-2 text-right">结存</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {flows.map(flow => (
                  <tr key={flow.id}>
                    <td className="p-2 font-mono font-semibold">{flow.id}</td>
                    <td className="p-2 font-semibold">{flow.productName}</td>
                    <td className="p-2 text-right text-rose-600 font-bold">{flow.quantity}</td>
                    <td className="p-2 text-right font-bold">{flow.postQuantity}</td>
                  </tr>
                ))}
                {flows.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">暂无库存流水</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <ReceiptText size={16} className="text-rose-500" />
              关联应收 (AR)
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50 text-slate-500"><th className="p-2">应收号</th><th className="p-2">客户</th><th className="p-2 text-right">金额</th><th className="p-2 text-center">状态</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map(ar => (
                  <tr key={ar.id}>
                    <td className="p-2 font-mono font-semibold">{ar.id}</td>
                    <td className="p-2 font-semibold">{ar.customerName}</td>
                    <td className="p-2 text-right text-rose-600 font-bold">¥{ar.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-center"><span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-bold">待收款</span></td>
                  </tr>
                ))}
                {receivables.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">暂无应收记录</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="font-semibold text-slate-400 block">{label}</span>
      <span className="font-bold text-slate-700">{children}</span>
    </div>
  );
}
