import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Send, Ban, GitCompareArrows, ShoppingCart } from 'lucide-react';
import { rfqApi } from '../api/rfq';
import type { RfqOrder, RfqStatus } from '../types/rfq';
import { RFQ_STATUS_LABELS } from '../types/rfq';
import { Button } from '../components/ui/Button';
import PageTitle from '../components/shared/PageTitle';
import Pagination from '../components/shared/Pagination';
import StatusTabs from '../components/shared/StatusTabs';
import { usePagination } from '../hooks/usePagination';

const TABS: { key: RfqStatus; label: string }[] = [
  { key: 'DRAFT', label: '草稿' },
  { key: 'QUOTING', label: '询价中' },
  { key: 'AWARDED', label: '已定标' },
  { key: 'VOIDED', label: '已作废' },
];

const STATUS_CLASSES: Record<RfqStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  QUOTING: 'bg-blue-50 text-blue-700 border-blue-200',
  AWARDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VOIDED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function RfqList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RfqStatus>('DRAFT');
  const [rows, setRows] = useState<RfqOrder[]>([]);
  const { page, pageSize, pageRows, setPage, changePageSize } = usePagination(rows);
  const [counts, setCounts] = useState<Record<RfqStatus, number>>({ DRAFT: 0, QUOTING: 0, AWARDED: 0, VOIDED: 0 });

  const loadData = () => {
    setRows(rfqApi.getList(activeTab));
    const nextCounts = TABS.reduce((acc, tab) => {
      acc[tab.key] = rfqApi.getList(tab.key).length;
      return acc;
    }, {} as Record<RfqStatus, number>);
    setCounts(nextCounts);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handlePublish = (id: string) => {
    try {
      rfqApi.publish(id);
      alert('询价单已发布，供应商端可见');
      loadData();
    } catch (err: any) {
      alert(err.message || '发布失败');
    }
  };

  const handleVoid = (id: string) => {
    try {
      rfqApi.void(id);
      alert('询价单已作废');
      loadData();
    } catch (err: any) {
      alert(err.message || '作废失败');
    }
  };

  const handleOpenPo = (row: RfqOrder) => {
    const poId = row.convertedPoIds?.[0];
    if (poId) {
      navigate(`/purchase/orders/${poId}`);
    } else {
      navigate(`/purchase/rfq/${row.id}/compare`);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <PageTitle compact title="采购询比价管理" description="询价单、供应商报价、比价定标与转采购订单。" actions={(
        <Button onClick={() => navigate('/purchase/rfq/new')} className="flex items-center gap-1.5 text-sm font-semibold"><Plus size={16} />新建询价单</Button>
      )} />

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <StatusTabs
          items={TABS.map(tab => ({ key: tab.key, label: tab.label, count: counts[tab.key] || 0 }))}
          activeKey={activeTab}
          onChange={key => setActiveTab(key as RfqStatus)}
          ariaLabel="询价单状态筛选"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-44">询价单号RFQ</th>
                <th className="p-3">标题</th>
                <th className="p-3 w-24 text-right">商品种数</th>
                <th className="p-3 w-28 text-center">状态</th>
                <th className="p-3 w-32">截止日期</th>
                <th className="p-3 w-28">创建人</th>
                <th className="p-3 w-64 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pageRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => navigate(`/purchase/rfq/${row.id}`)}>
                  <td className="p-3 font-semibold text-primary font-mono">{row.id}</td>
                  <td className="p-3 font-medium text-slate-800">{row.title}</td>
                  <td className="p-3 text-right font-mono">{row.itemCount}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${STATUS_CLASSES[row.status]}`}>
                      {RFQ_STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{row.deadline}</td>
                  <td className="p-3 text-slate-600">{row.createdBy}</td>
                  <td className="p-3 text-center space-x-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate(`/purchase/rfq/${row.id}`)} className="inline-flex items-center gap-0.5 p-1 text-slate-600 hover:text-primary font-medium cursor-pointer">
                      <Eye size={14} /> 查看
                    </button>
                    {row.status === 'DRAFT' && (
                      <>
                        <button onClick={() => navigate(`/purchase/rfq/${row.id}/edit`)} className="inline-flex items-center gap-0.5 p-1 text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                          <Edit size={14} /> 编辑
                        </button>
                        <button onClick={() => handlePublish(row.id)} className="inline-flex items-center gap-0.5 p-1 text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">
                          <Send size={14} /> 发布询价
                        </button>
                        <button onClick={() => handleVoid(row.id)} className="inline-flex items-center gap-0.5 p-1 text-rose-600 hover:text-rose-800 font-medium cursor-pointer">
                          <Ban size={14} /> 作废
                        </button>
                      </>
                    )}
                    {row.status === 'QUOTING' && (
                      <>
                        <button onClick={() => navigate(`/purchase/rfq/${row.id}/compare`)} className="inline-flex items-center gap-0.5 p-1 text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                          <GitCompareArrows size={14} /> 报价对比
                        </button>
                        <button onClick={() => navigate(`/purchase/rfq/${row.id}/compare`)} className="inline-flex items-center gap-0.5 p-1 text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">
                          定标
                        </button>
                      </>
                    )}
                    {row.status === 'AWARDED' && (
                      <button onClick={() => handleOpenPo(row)} className="inline-flex items-center gap-0.5 p-1 text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer">
                        <ShoppingCart size={14} /> 转为PO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">暂无询价单数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </div>
  );
}
