import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Search, Send, CheckCircle, XCircle, Trash2, Truck } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesOrder, SalesOrderStatus } from '../types/sales';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const STATUS_TABS: Array<SalesOrderStatus | 'ALL'> = ['ALL', 'DRAFT', 'PENDING_AUDIT', 'APPROVED', 'PARTIAL_OUTBOUND', 'COMPLETED', 'VOIDED'];

const STATUS_META: Record<SalesOrderStatus | 'ALL', { label: string; classes: string }> = {
  ALL: { label: '全部', classes: 'bg-slate-100 text-slate-700 border border-slate-200' },
  DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
  PENDING_AUDIT: { label: '待审核', classes: 'bg-orange-50 text-orange-700 border border-orange-200' },
  APPROVED: { label: '已审核', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  PARTIAL_OUTBOUND: { label: '部分出库', classes: 'bg-sky-50 text-sky-700 border border-sky-200' },
  COMPLETED: { label: '已完成', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
};

function StatusBadge({ status }: { status: SalesOrderStatus }) {
  const item = STATUS_META[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.classes}`}>{item.label}</span>;
}

export default function SalesOrderList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SalesOrderStatus | 'ALL'>('ALL');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [soNumber, setSoNumber] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [orderDateStart, setOrderDateStart] = useState('');
  const [orderDateEnd, setOrderDateEnd] = useState('');

  const customers = salesApi.getCustomers();

  const loadData = () => {
    const filters: {
      status: SalesOrderStatus | '';
      soNumber: string;
      customerCode: string;
      orderDateStart: string;
      orderDateEnd: string;
    } = {
      status: activeTab === 'ALL' ? '' : activeTab,
      soNumber,
      customerCode,
      orderDateStart,
      orderDateEnd
    };
    setOrders(salesApi.getSalesOrders(filters));
    const nextCounts: Record<string, number> = {};
    STATUS_TABS.forEach(status => {
      nextCounts[status] = salesApi.getSalesOrders({
        ...filters,
        status: status === 'ALL' ? '' : status
      }).length;
    });
    setCounts(nextCounts);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, customerCode, orderDateStart, orderDateEnd]);

  const runAction = (label: string, fn: () => void) => {
    try {
      fn();
      alert(`${label}成功`);
      loadData();
    } catch (err: any) {
      alert(err.message || `${label}失败`);
    }
  };

  const createOutbound = (orderId: string) => {
    try {
      const draft = salesApi.createSalesOutboundFromSO(orderId);
      navigate(`/sales/outbounds/${draft.id}/edit`);
    } catch (err: any) {
      alert(err.message || '创建出库单失败');
    }
  };

  const actionButton = (icon: React.ReactNode, label: string, onClick: () => void, tone = 'text-slate-600') => (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 font-semibold ${tone}`}
    >
      {icon}
      {label}
    </button>
  );

  const renderActions = (order: SalesOrder) => {
    if (order.status === 'DRAFT') {
      return (
        <>
          {actionButton(<Eye size={13} />, '查看', () => navigate(`/sales/orders/${order.id}`))}
          {actionButton(<Edit size={13} />, '编辑', () => navigate(`/sales/orders/${order.id}/edit`), 'text-amber-600')}
          {actionButton(<Send size={13} />, '提交审核', () => runAction('提交审核', () => salesApi.submitSalesOrder(order.id)), 'text-blue-600')}
          {actionButton(<Trash2 size={13} />, '删除', () => {
            if (window.confirm('确认删除该草稿销售订单？')) runAction('删除', () => salesApi.deleteSalesOrder(order.id));
          }, 'text-rose-600')}
        </>
      );
    }
    if (order.status === 'PENDING_AUDIT') {
      return (
        <>
          {actionButton(<Eye size={13} />, '查看', () => navigate(`/sales/orders/${order.id}`))}
          {actionButton(<CheckCircle size={13} />, '审核', () => runAction('审核', () => salesApi.approveSalesOrder(order.id)), 'text-emerald-600')}
          {actionButton(<XCircle size={13} />, '驳回', () => runAction('驳回', () => salesApi.rejectSalesOrder(order.id)), 'text-orange-600')}
          {actionButton(<XCircle size={13} />, '作废', () => runAction('作废', () => salesApi.voidSalesOrder(order.id)), 'text-rose-600')}
        </>
      );
    }
    if (order.status === 'APPROVED' || order.status === 'PARTIAL_OUTBOUND') {
      return (
        <>
          {actionButton(<Eye size={13} />, '查看', () => navigate(`/sales/orders/${order.id}`))}
          {actionButton(<Truck size={13} />, '创建出库单', () => createOutbound(order.id), 'text-indigo-600')}
        </>
      );
    }
    return actionButton(<Eye size={13} />, '查看', () => navigate(`/sales/orders/${order.id}`));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold text-slate-800">销售订单</h1>
          <p className="text-xs text-slate-500 mt-1">SO 审核后锁定占用库存，可用 = 现存 - 占用。</p>
        </div>
        <Button size="sm" className="gap-1 font-bold" onClick={() => navigate('/sales/orders/new')}>
          <Plus size={14} />
          新增
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            loadData();
          }}
          className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs"
        >
          <Input value={soNumber} onChange={e => setSoNumber(e.target.value)} placeholder="订单号 SO" className="h-9 text-xs" />
          <select value={customerCode} onChange={e => setCustomerCode(e.target.value)} className="h-9 border border-slate-200 rounded-md px-2">
            <option value="">全部客户</option>
            {customers.map(c => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
          </select>
          <Input type="date" value={orderDateStart} onChange={e => setOrderDateStart(e.target.value)} className="h-9 text-xs" />
          <Input type="date" value={orderDateEnd} onChange={e => setOrderDateEnd(e.target.value)} className="h-9 text-xs" />
          <Button type="submit" size="sm" variant="outline" className="gap-1 font-bold">
            <Search size={14} />
            查询
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap border-b border-slate-100 pb-3">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                activeTab === tab ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {STATUS_META[tab].label}
              <span className={`ml-1 ${activeTab === tab ? 'text-white/80' : 'text-slate-400'}`}>{counts[tab] || 0}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-40">订单号 SO</th>
                <th className="p-3">客户</th>
                <th className="p-3 w-24">状态</th>
                <th className="p-3 w-24 text-right">商品种数</th>
                <th className="p-3 w-32 text-right">总金额</th>
                <th className="p-3 w-28">下单日期</th>
                <th className="p-3 w-[320px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {orders.map(order => (
                <tr key={order.id} onClick={() => navigate(`/sales/orders/${order.id}`)} className="hover:bg-slate-50/50 cursor-pointer">
                  <td className="p-3 font-mono font-bold text-primary">{order.id}</td>
                  <td className="p-3 font-semibold text-slate-700">{order.customerName}</td>
                  <td className="p-3"><StatusBadge status={order.status} /></td>
                  <td className="p-3 text-right font-semibold">{order.itemCount}</td>
                  <td className="p-3 text-right font-extrabold text-slate-800">¥{order.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-slate-500">{order.orderDate}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 flex-wrap">{renderActions(order)}</div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">暂无销售订单</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
