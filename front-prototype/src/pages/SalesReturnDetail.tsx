import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Edit3, ExternalLink, FileText, ReceiptText, RotateCcw, XCircle } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesReturn, SalesReturnStatus } from '../types/sales';
import type { InventoryFlow } from '../types/stockIn';
import type { AccountReceivable } from '../db';
import { Button } from '../components/ui/Button';

const STATUS_META: Record<SalesReturnStatus, { label: string; classes: string }> = {
  DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
  CONFIRMED: { label: '已确认', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
};

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: SalesReturnStatus }) {
  const meta = STATUS_META[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${meta.classes}`}>{meta.label}</span>;
}

export default function SalesReturnDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sr, setSr] = useState<SalesReturn | null>(null);
  const [flows, setFlows] = useState<InventoryFlow[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);

  const loadData = () => {
    if (!id) return;
    const next = salesApi.getSalesReturnById(id);
    if (!next) {
      alert('销售退货单不存在');
      navigate('/sales/returns');
      return;
    }
    setSr(next);
    setFlows(salesApi.getInventoryFlows(next.id));
    setReceivables(salesApi.getReceivableRecords(next.sourceOutboundId).filter(item => item.sourceNo === next.id));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!sr) return <div className="p-8 text-center text-slate-400">加载中...</div>;

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
    <div className="space-y-4 pb-16 text-xs">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales/returns')} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">销售退货单 {sr.id}</h1>
              <StatusBadge status={sr.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              来源销售出库单：
              <Link to={`/sales/outbounds/${sr.sourceOutboundId}`} className="font-mono font-bold text-primary hover:underline ml-1">
                {sr.sourceOutboundId}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/sales/returns')} className="font-bold">返回列表</Button>
          {sr.status === 'DRAFT' && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/sales/returns/${sr.id}/edit`)} className="gap-1 font-bold text-amber-600 border-amber-200">
                <Edit3 size={13} />
                编辑
              </Button>
              <Button size="sm" onClick={() => runAction('确认退货', () => salesApi.confirmSalesReturn(sr.id))} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle size={13} />
                确认退货
              </Button>
              <Button variant="outline" size="sm" onClick={() => runAction('作废', () => salesApi.voidSalesReturn(sr.id))} className="gap-1 font-bold text-rose-600 border-rose-200">
                <XCircle size={13} />
                作废
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <FileText size={16} className="text-slate-400" />
            基本信息
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info label="来源 SOO">
              <Link to={`/sales/outbounds/${sr.sourceOutboundId}`} className="font-mono text-primary hover:underline flex items-center gap-1">
                {sr.sourceOutboundId}
                <ExternalLink size={11} />
              </Link>
            </Info>
            <Info label="来源 SO">
              <Link to={`/sales/orders/${sr.sourceSalesOrderId}`} className="font-mono text-primary hover:underline flex items-center gap-1">
                {sr.sourceSalesOrderId}
                <ExternalLink size={11} />
              </Link>
            </Info>
            <Info label="客户">{sr.customerName}</Info>
            <Info label="仓库">{sr.warehouseName}</Info>
            <Info label="退货日期">{sr.returnDate}</Info>
            <Info label="退货总额">¥{money(sr.totalAmount)}</Info>
          </div>
          <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <p className="font-semibold text-slate-400">退货原因</p>
            <p className="mt-1 font-bold text-slate-700 leading-6">{sr.returnReason || '-'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">制单信息</h3>
          <div className="space-y-3">
            <Info label="制单人">{sr.createdBy}</Info>
            <Info label="制单时间">{sr.createdAt}</Info>
            <Info label="确认人">{sr.confirmedBy || '-'}</Info>
            <Info label="确认时间">{sr.confirmedAt || '-'}</Info>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <RotateCcw size={16} className="text-emerald-600" />
          退货明细
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">编码</th>
                <th className="p-3">名称</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 w-24 text-right">已出数量</th>
                <th className="p-3 w-24 text-right">退货数量</th>
                <th className="p-3 w-28 text-right">单价</th>
                <th className="p-3 w-32 text-right">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sr.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-center text-slate-400">{index + 1}</td>
                  <td className="p-3 font-semibold">{item.productCode}</td>
                  <td className="p-3 font-bold text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-slate-500">{item.unit}</td>
                  <td className="p-3 text-right font-bold text-primary">{item.outboundQuantity}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{item.returnQuantity}</td>
                  <td className="p-3 text-right font-semibold">¥{money(item.price)}</td>
                  <td className="p-3 text-right font-black">¥{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100 flex justify-between font-bold">
          <span>商品种数：{sr.itemCount}</span>
          <span>退货数量：{sr.totalQuantity}</span>
          <span className="text-rose-600">退货总金额：¥{money(sr.totalAmount)}</span>
        </div>
      </div>

      {sr.status === 'CONFIRMED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">关联库存流水 (FL)</h3>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-slate-100 bg-slate-50 text-slate-500"><th className="p-2">流水号</th><th className="p-2">商品</th><th className="p-2 text-right">数量</th><th className="p-2 text-right">结存</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {flows.map(flow => (
                  <tr key={flow.id}>
                    <td className="p-2 font-mono font-semibold">{flow.id}</td>
                    <td className="p-2 font-semibold">{flow.productName}</td>
                    <td className="p-2 text-right text-emerald-600 font-bold">+{flow.quantity}</td>
                    <td className="p-2 text-right font-bold">{flow.postQuantity}</td>
                  </tr>
                ))}
                {flows.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">暂无库存流水</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <ReceiptText size={16} className="text-emerald-600" />
              应收冲减记录
            </h3>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-slate-100 bg-slate-50 text-slate-500"><th className="p-2">应收号</th><th className="p-2">客户</th><th className="p-2 text-right">金额</th><th className="p-2 text-center">状态</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map(ar => (
                  <tr key={ar.id}>
                    <td className="p-2 font-mono font-semibold">{ar.id}</td>
                    <td className="p-2 font-semibold">{ar.customerName}</td>
                    <td className="p-2 text-right text-emerald-600 font-bold">¥{money(ar.amount)}</td>
                    <td className="p-2 text-center"><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">冲减应收</span></td>
                  </tr>
                ))}
                {receivables.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">暂无应收冲减记录</td></tr>}
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
