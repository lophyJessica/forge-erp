import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Edit, Eye, Search, XCircle } from 'lucide-react';
import { salesApi } from '../api/sales';
import type { SalesOutbound, SalesOutboundStatus } from '../types/sales';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const STATUS_TABS: Array<SalesOutboundStatus | 'ALL'> = ['ALL', 'DRAFT', 'CONFIRMED', 'VOIDED'];
const STATUS_META: Record<SalesOutboundStatus | 'ALL', { label: string; classes: string }> = {
  ALL: { label: '全部', classes: 'bg-slate-100 text-slate-700 border border-slate-200' },
  DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
  CONFIRMED: { label: '已确认', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
};

function StatusBadge({ status }: { status: SalesOutboundStatus }) {
  const meta = STATUS_META[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${meta.classes}`}>{meta.label}</span>;
}

export default function SalesOutboundList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SalesOutboundStatus | 'ALL'>('ALL');
  const [outbounds, setOutbounds] = useState<SalesOutbound[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sooNumber, setSooNumber] = useState('');
  const [soNumber, setSoNumber] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');

  const customers = salesApi.getCustomers();
  const warehouses = salesApi.getWarehouses();

  const loadData = () => {
    const filters: {
      status: SalesOutboundStatus | '';
      sooNumber: string;
      soNumber: string;
      customerCode: string;
      warehouseCode: string;
    } = {
      status: activeTab === 'ALL' ? '' : activeTab,
      sooNumber,
      soNumber,
      customerCode,
      warehouseCode
    };
    setOutbounds(salesApi.getSalesOutbounds(filters));
    const nextCounts: Record<string, number> = {};
    STATUS_TABS.forEach(status => {
      nextCounts[status] = salesApi.getSalesOutbounds({ ...filters, status: status === 'ALL' ? '' : status }).length;
    });
    setCounts(nextCounts);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, customerCode, warehouseCode]);

  const runAction = (label: string, fn: () => void) => {
    try {
      fn();
      alert(`${label}成功`);
      loadData();
    } catch (err: any) {
      alert(err.message || `${label}失败`);
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

  const renderActions = (outbound: SalesOutbound) => {
    if (outbound.status === 'DRAFT') {
      return (
        <>
          {actionButton(<Eye size={13} />, '查看', () => navigate(`/sales/outbounds/${outbound.id}`))}
          {actionButton(<Edit size={13} />, '编辑', () => navigate(`/sales/outbounds/${outbound.id}/edit`), 'text-amber-600')}
          {actionButton(<CheckCircle size={13} />, '确认出库', () => runAction('确认出库', () => salesApi.confirmSalesOutbound(outbound.id)), 'text-emerald-600')}
          {actionButton(<XCircle size={13} />, '作废', () => runAction('作废', () => salesApi.voidSalesOutbound(outbound.id)), 'text-rose-600')}
        </>
      );
    }
    return actionButton(<Eye size={13} />, '查看', () => navigate(`/sales/outbounds/${outbound.id}`));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold text-slate-800">销售出库单</h1>
          <p className="text-xs text-slate-500 mt-1">SOO 确认时扣减现存、释放占用、生成库存流水与应收。</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            loadData();
          }}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs"
        >
          <Input value={sooNumber} onChange={e => setSooNumber(e.target.value)} placeholder="出库单号 SOO" className="h-9 text-xs" />
          <Input value={soNumber} onChange={e => setSoNumber(e.target.value)} placeholder="来源 SO" className="h-9 text-xs" />
          <select value={customerCode} onChange={e => setCustomerCode(e.target.value)} className="h-9 border border-slate-200 rounded-md px-2">
            <option value="">全部客户</option>
            {customers.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <select value={warehouseCode} onChange={e => setWarehouseCode(e.target.value)} className="h-9 border border-slate-200 rounded-md px-2">
            <option value="">全部仓库</option>
            {warehouses.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
          </select>
          <Button type="submit" size="sm" variant="outline" className="gap-1 font-bold md:col-span-2">
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
                <th className="p-3 w-44">出库单号 SOO</th>
                <th className="p-3 w-40">来源 SO</th>
                <th className="p-3">客户</th>
                <th className="p-3 w-28">仓库</th>
                <th className="p-3 w-24">状态</th>
                <th className="p-3 w-28">出库日期</th>
                <th className="p-3 w-64">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {outbounds.map(outbound => (
                <tr key={outbound.id} onClick={() => navigate(`/sales/outbounds/${outbound.id}`)} className="hover:bg-slate-50/50 cursor-pointer">
                  <td className="p-3 font-mono font-bold text-primary">{outbound.id}</td>
                  <td className="p-3 font-mono font-semibold text-indigo-600">{outbound.salesOrderId}</td>
                  <td className="p-3 font-semibold text-slate-700">{outbound.customerName}</td>
                  <td className="p-3 text-slate-500">{outbound.warehouseName}</td>
                  <td className="p-3"><StatusBadge status={outbound.status} /></td>
                  <td className="p-3 text-slate-500">{outbound.outboundDate}</td>
                  <td className="p-3"><div className="flex items-center gap-1 flex-wrap">{renderActions(outbound)}</div></td>
                </tr>
              ))}
              {outbounds.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">暂无销售出库单</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
