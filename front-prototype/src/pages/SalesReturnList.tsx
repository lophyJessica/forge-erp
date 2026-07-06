import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Edit3, Eye, RotateCcw, Search, Trash2, XCircle } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesReturn, SalesReturnStatus } from '../types/sales';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const TABS: Array<SalesReturnStatus | 'ALL'> = ['ALL', 'DRAFT', 'CONFIRMED', 'VOIDED'];
const STATUS_LABEL: Record<SalesReturnStatus | 'ALL', string> = {
  ALL: '全部',
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  VOIDED: '已作废'
};
const BADGE: Record<SalesReturnStatus, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VOIDED: 'bg-rose-50 text-rose-700 border-rose-200'
};

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SalesReturnList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SalesReturnStatus | 'ALL'>('ALL');
  const [srNumber, setSrNumber] = useState('');
  const [sooNumber, setSooNumber] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const customers = salesApi.getCustomers();

  const loadData = () => {
    setReturns(salesApi.getSalesReturns({
      status: activeTab,
      srNumber,
      sooNumber,
      customerCode
    }));
  };

  useEffect(() => {
    loadData();
  }, [activeTab, customerCode]);

  const countOf = (tab: SalesReturnStatus | 'ALL') => salesApi.getSalesReturns({ status: tab }).length;

  const runAction = (label: string, action: () => void) => {
    try {
      action();
      alert(`${label}成功`);
      loadData();
    } catch (err: any) {
      alert(err.message || `${label}失败`);
    }
  };

  const actionBtn = (icon: React.ReactNode, label: string, onClick: () => void, tone = 'text-slate-600') => (
    <button
      type="button"
      onClick={event => {
        event.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 font-bold hover:bg-slate-100 ${tone}`}
    >
      {icon}
      {label}
    </button>
  );

  const renderActions = (item: SalesReturn) => {
    if (item.status === 'DRAFT') {
      return (
        <>
          {actionBtn(<Eye size={13} />, '查看', () => navigate(`/sales/returns/${item.id}`))}
          {actionBtn(<Edit3 size={13} />, '编辑', () => navigate(`/sales/returns/${item.id}/edit`), 'text-amber-600')}
          {actionBtn(<CheckCircle size={13} />, '确认退货', () => runAction('确认退货', () => salesApi.confirmSalesReturn(item.id)), 'text-emerald-600')}
          {actionBtn(<XCircle size={13} />, '作废', () => runAction('作废', () => salesApi.voidSalesReturn(item.id)), 'text-rose-600')}
          {actionBtn(<Trash2 size={13} />, '删除', () => {
            if (window.confirm('确认删除该草稿销售退货单？')) runAction('删除', () => salesApi.deleteSalesReturn(item.id));
          }, 'text-slate-500')}
        </>
      );
    }
    return actionBtn(<Eye size={13} />, '查看', () => navigate(`/sales/returns/${item.id}`));
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-t-lg shadow-sm">
        {TABS.map(tab => {
          const active = activeTab === tab;
          const color = active
            ? tab === 'CONFIRMED'
              ? 'border-emerald-500 text-emerald-600 font-bold'
              : tab === 'VOIDED'
              ? 'border-rose-500 text-rose-600 font-bold'
              : tab === 'DRAFT'
              ? 'border-slate-500 text-slate-700 font-bold'
              : 'border-slate-900 text-slate-900 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-700';
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 border-b-2 transition-colors ${color}`}>
              {STATUS_LABEL[tab]} <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">{countOf(tab)}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white p-5 rounded-b-lg shadow-sm border-x border-b border-slate-100">
        <form
          onSubmit={event => {
            event.preventDefault();
            loadData();
          }}
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          <Input value={srNumber} onChange={event => setSrNumber(event.target.value)} placeholder="退货单号 SR" className="h-9 text-xs" />
          <Input value={sooNumber} onChange={event => setSooNumber(event.target.value)} placeholder="来源 SOO" className="h-9 text-xs" />
          <select value={customerCode} onChange={event => setCustomerCode(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2">
            <option value="">全部客户</option>
            {customers.map(customer => <option key={customer.code} value={customer.code}>{customer.name}</option>)}
          </select>
          <Button type="submit" size="sm" className="gap-1 font-bold"><Search size={14} />搜索</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setSrNumber(''); setSooNumber(''); setCustomerCode(''); }} className="gap-1 font-bold"><RotateCcw size={14} />重置</Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-500">销售退货单必须由已确认 SOO 下推创建</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-40">退货单号 SR</th>
                <th className="p-3 w-40">来源 SOO</th>
                <th className="p-3">客户</th>
                <th className="p-3 w-24 text-center">状态</th>
                <th className="p-3 w-28">退货日期</th>
                <th className="p-3 w-24 text-right">商品种数</th>
                <th className="p-3 w-32 text-right">退货总金额</th>
                <th className="p-3 w-72">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map(item => (
                <tr key={item.id} onClick={() => navigate(`/sales/returns/${item.id}`)} className="hover:bg-slate-50/60 cursor-pointer">
                  <td className="p-3 font-mono font-black text-primary">{item.id}</td>
                  <td className="p-3 font-mono font-bold text-indigo-600">{item.sourceOutboundId}</td>
                  <td className="p-3 font-bold text-slate-700">{item.customerName}</td>
                  <td className="p-3 text-center"><span className={`inline-flex rounded border px-2 py-0.5 font-bold ${BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span></td>
                  <td className="p-3 text-slate-500">{item.returnDate}</td>
                  <td className="p-3 text-right font-bold">{item.itemCount}</td>
                  <td className="p-3 text-right font-black text-slate-800">¥{money(item.totalAmount)}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">{renderActions(item)}</div></td>
                </tr>
              ))}
              {returns.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">暂无销售退货单</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
