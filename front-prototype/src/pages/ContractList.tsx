import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Edit3, Eye, FilePlus2, RefreshCw, Search, Trash2, XCircle } from 'lucide-react';
import { contractApi } from '../api/contract';
import type { Contract, ContractStatus, ContractType } from '../types/contract';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import PageTitle from '../components/shared/PageTitle';
import Pagination from '../components/shared/Pagination';
import StatusTabs from '../components/shared/StatusTabs';
import { usePagination } from '../hooks/usePagination';

const TABS: Array<ContractStatus | 'ALL'> = ['ALL', 'DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'];

const STATUS_LABEL: Record<ContractStatus | 'ALL', string> = {
  ALL: '全部',
  DRAFT: '草稿',
  ACTIVE: '执行中',
  EXPIRED: '已到期',
  TERMINATED: '已终止'
};

const STATUS_BADGE: Record<ContractStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200'
};

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function typeLabel(type: ContractType) {
  return type === 'PURCHASE' ? '采购' : '销售';
}

export default function ContractList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContractStatus | 'ALL'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<ContractType | 'ALL'>('ALL');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const { page, pageSize, pageRows, setPage, changePageSize } = usePagination(contracts);

  const loadData = () => {
    setContracts(contractApi.getContracts({ status: activeTab, keyword, type }));
  };

  useEffect(() => {
    loadData();
  }, [activeTab, type]);

  const countOf = (status: ContractStatus | 'ALL') => contractApi.getContracts({ status }).length;

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

  const renderActions = (item: Contract) => {
    if (item.status === 'DRAFT') {
      return (
        <>
          {actionBtn(<Eye size={13} />, '查看', () => navigate(`/contracts/${item.id}`))}
          {actionBtn(<Edit3 size={13} />, '编辑', () => navigate(`/contracts/${item.id}/edit`), 'text-amber-600')}
          {actionBtn(<CheckCircle size={13} />, '生效', () => runAction('合同生效', () => contractApi.activateContract(item.id)), 'text-emerald-600')}
          {actionBtn(<Trash2 size={13} />, '删除', () => {
            if (window.confirm('确认删除该草稿合同？')) runAction('删除', () => contractApi.deleteContract(item.id));
          }, 'text-slate-500')}
        </>
      );
    }
    if (item.status === 'ACTIVE') {
      return (
        <>
          {actionBtn(<Eye size={13} />, '查看', () => navigate(`/contracts/${item.id}`))}
          {actionBtn(<XCircle size={13} />, '终止', () => {
            if (window.confirm('确认终止该执行中合同？')) runAction('终止', () => contractApi.terminateContract(item.id));
          }, 'text-rose-600')}
        </>
      );
    }
    if (item.status === 'EXPIRED') {
      return (
        <>
          {actionBtn(<Eye size={13} />, '查看', () => navigate(`/contracts/${item.id}`))}
          {actionBtn(<RefreshCw size={13} />, '续约', () => {
            const renewed = contractApi.renewContract(item.id);
            alert('续约草稿已创建');
            navigate(`/contracts/${renewed.id}/edit`);
          }, 'text-emerald-600')}
        </>
      );
    }
    return actionBtn(<Eye size={13} />, '查看', () => navigate(`/contracts/${item.id}`));
  };

  return (
    <div className="space-y-4 text-xs pb-10">
      <PageTitle compact title="合同管理" description="独立文档台账，仅维护合同基本信息和扫描件文件名。" actions={(
        <Button size="sm" onClick={() => navigate('/contracts/new')} className="gap-1 font-bold"><FilePlus2 size={14} />新增合同</Button>
      )} />

      <StatusTabs
        className="rounded-t-lg shadow-sm"
        items={TABS.map(tab => ({ key: tab, label: STATUS_LABEL[tab], count: countOf(tab) }))}
        activeKey={activeTab}
        onChange={key => setActiveTab(key as ContractStatus | 'ALL')}
        ariaLabel="合同状态筛选"
      />

      <div className="bg-white p-5 rounded-b-lg shadow-sm border-x border-b border-slate-100">
        <form
          onSubmit={event => {
            event.preventDefault();
            loadData();
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)] md:items-center lg:grid-cols-[minmax(20rem,2fr)_minmax(12rem,1fr)_auto]"
        >
          <Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="合同号 / 名称 / 对方" className="h-9 text-xs" />
          <select value={type} onChange={event => setType(event.target.value as ContractType | 'ALL')} className="h-9 w-full rounded-md border border-slate-200 px-2">
            <option value="ALL">全部类型</option>
            <option value="PURCHASE">采购合同</option>
            <option value="SALES">销售合同</option>
          </select>
          <div className="contract-filter-actions flex items-center gap-2 md:col-span-2 lg:col-span-1">
            <Button type="submit" size="sm" className="h-9 gap-1 px-4 font-bold"><Search size={14} />搜索</Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setKeyword('');
                setType('ALL');
                setContracts(contractApi.getContracts({ status: activeTab, keyword: '', type: 'ALL' }));
              }}
              className="h-9 gap-1 px-4 font-bold"
            >
              <RefreshCw size={14} />
              重置
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-40">合同号</th>
                <th className="p-3 min-w-52">合同名称</th>
                <th className="p-3 w-48">客户/供应商</th>
                <th className="p-3 w-20 text-center">类型</th>
                <th className="p-3 w-32 text-right">金额</th>
                <th className="p-3 w-28">签订日期</th>
                <th className="p-3 w-28">到期日期</th>
                <th className="p-3 w-24 text-center">状态</th>
                <th className="p-3 w-56">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(item => (
                <tr key={item.id} onClick={() => navigate(`/contracts/${item.id}`)} className="hover:bg-slate-50/60 cursor-pointer">
                  <td className="p-3 font-mono font-black text-primary">{item.id}</td>
                  <td className="p-3 font-bold text-slate-800">{item.name}</td>
                  <td className="p-3 text-slate-700">{item.counterpartyName}</td>
                  <td className="p-3 text-center">
                    <span className={`rounded px-2 py-0.5 font-bold ${item.type === 'PURCHASE' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {typeLabel(item.type)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-slate-800">¥{money(item.amount)}</td>
                  <td className="p-3 text-slate-500">{item.signDate}</td>
                  <td className="p-3 text-slate-500">{item.expireDate}</td>
                  <td className="p-3 text-center"><span className={`inline-flex rounded border px-2 py-0.5 font-bold ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span></td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">{renderActions(item)}</div></td>
                </tr>
              ))}
              {contracts.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-slate-400">暂无合同记录</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageSize={pageSize} total={contracts.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </div>
  );
}
