import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurchaseOrder, 
  PurchaseOrderStatus,
  Supplier,
  Warehouse
} from '../types/purchaseOrder';
import { 
  purchaseOrderApi, 
  MOCK_SUPPLIERS, 
  MOCK_WAREHOUSES 
} from '../api/purchaseOrder';
import { integrationApi } from '../api/integration';
import WmsStatusTag from '../components/WmsStatusTag';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Download, Upload, Eye, Edit, Trash2, XCircle, Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export default function PurchaseOrderList() {
  const navigate = useNavigate();

  // --- 状态定义 ---
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 筛选条件状态
  const [poNumber, setPoNumber] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [orderDateStart, setOrderDateStart] = useState('');
  const [orderDateEnd, setOrderDateEnd] = useState('');
  const [expectedDateStart, setExpectedDateStart] = useState('');
  const [expectedDateEnd, setExpectedDateEnd] = useState('');
  const [updatedDateStart, setUpdatedDateStart] = useState('');
  const [updatedDateEnd, setUpdatedDateEnd] = useState('');

  // 展开折叠高级筛选
  const [isExpanded, setIsExpanded] = useState(false);

  // 作废弹窗状态
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // 二次确认弹窗状态
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CLOSE' | null;
    title: string;
    msg: string;
    orderId: string | null;
  }>({ type: null, title: '', msg: '', orderId: null });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 各状态数量计数
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // --- 数据加载 ---
  const loadData = async () => {
    await integrationApi.applyWmsInboundFeedback();
    // 叠加条件进行筛选
    const currentStatus = activeTab === 'ALL' ? (statusFilter === 'ALL' ? '' : statusFilter) : activeTab;
    
    let res = purchaseOrderApi.getOrders({
      status: currentStatus as any,
      poNumber,
      supplierCode,
      warehouseCode,
      orderDateStart,
      orderDateEnd,
      expectedDateStart: isExpanded ? expectedDateStart : '',
      expectedDateEnd: isExpanded ? expectedDateEnd : '',
    });

    if (isExpanded) {
      if (updatedDateStart) {
        res = res.filter(o => {
          const mDate = o.updatedAt || o.createdAt;
          const dateStr = mDate.split(' ')[0];
          return dateStr >= updatedDateStart;
        });
      }
      if (updatedDateEnd) {
        res = res.filter(o => {
          const mDate = o.updatedAt || o.createdAt;
          const dateStr = mDate.split(' ')[0];
          return dateStr <= updatedDateEnd;
        });
      }
    }

    setOrders(res);
    setSelectedIds([]);

    // 重新计算 Tab 计数（计数反映除 Tab 状态外，其他筛选条件叠加后的结果）
    const allStatuses: (PurchaseOrderStatus | 'ALL')[] = [
      'ALL', 'DRAFT', 'PENDING_AUDIT', 'PENDING_STOCK_IN', 'PARTIAL_STOCK_IN', 'COMPLETED', 'VOIDED'
    ];
    const counts: Record<string, number> = {};
    allStatuses.forEach(st => {
      let tempRes = purchaseOrderApi.getOrders({
        status: st === 'ALL' ? '' : st,
        poNumber,
        supplierCode,
        warehouseCode,
        orderDateStart,
        orderDateEnd,
        expectedDateStart: isExpanded ? expectedDateStart : '',
        expectedDateEnd: isExpanded ? expectedDateEnd : '',
      });
      if (isExpanded) {
        if (updatedDateStart) {
          tempRes = tempRes.filter(o => {
            const mDate = o.updatedAt || o.createdAt;
            const dateStr = mDate.split(' ')[0];
            return dateStr >= updatedDateStart;
          });
        }
        if (updatedDateEnd) {
          tempRes = tempRes.filter(o => {
            const mDate = o.updatedAt || o.createdAt;
            const dateStr = mDate.split(' ')[0];
            return dateStr <= updatedDateEnd;
          });
        }
      }
      counts[st] = tempRes.length;
    });
    setTabCounts(counts);
  };

  useEffect(() => {
    void loadData();
  }, [activeTab, statusFilter, supplierCode, warehouseCode, orderDateStart, orderDateEnd, expectedDateStart, expectedDateEnd, updatedDateStart, updatedDateEnd, isExpanded]);

  // --- 交互处理 ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    void loadData();
  };

  const handleReset = () => {
    setPoNumber('');
    setSupplierCode('');
    setWarehouseCode('');
    setStatusFilter('ALL');
    setOrderDateStart('');
    setOrderDateEnd('');
    setExpectedDateStart('');
    setExpectedDateEnd('');
    setUpdatedDateStart('');
    setUpdatedDateEnd('');
    setCurrentPage(1);
  };

  const handleTabChange = (tab: PurchaseOrderStatus | 'ALL') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // 勾选处理
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedOrders.map(o => o.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedOrders.map(o => o.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // 行内操作
  const handleVoidClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVoidingId(id);
    setVoidReason('');
  };

  const handleConfirmVoid = () => {
    if (!voidingId) return;
    try {
      purchaseOrderApi.voidOrder(voidingId, voidReason);
      setVoidingId(null);
      void loadData();
    } catch (err: any) {
      alert(err.message || '作废失败');
    }
  };

  const handleAction = (actionType: typeof confirmAction['type'], orderId: string | null) => {
    if (!orderId) return;
    try {
      switch (actionType) {
        case 'DELETE':
          purchaseOrderApi.deleteOrder(orderId);
          alert('采购订单已删除');
          break;
        case 'SUBMIT':
          purchaseOrderApi.submitOrder(orderId);
          alert('已成功提交审核');
          break;
        case 'APPROVE':
          purchaseOrderApi.approveOrder(orderId);
          alert('订单审核已通过');
          break;
        case 'REJECT':
          purchaseOrderApi.rejectOrder(orderId);
          alert('订单已驳回至草稿态');
          break;
        case 'CLOSE':
          purchaseOrderApi.closeOrder(orderId);
          alert('订单已人工强行关闭完结');
          break;
      }
      setConfirmAction({ type: null, title: '', msg: '', orderId: null });
      void loadData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleDispatchWms = async (orderId: string) => {
    try {
      await integrationApi.dispatchPurchaseOrder(orderId);
      alert('采购订单已下发至WMS');
      await loadData();
    } catch (err: any) {
      alert(err.message || '下发WMS失败');
    }
  };

  const handleExport = () => {
    // 带有选中 ID 时导出选中，否则导出当前筛选出来的全部 ID
    const exportIds = selectedIds.length > 0 ? selectedIds : orders.map(o => o.id);
    if (exportIds.length === 0) {
      alert('无可导出的订单记录');
      return;
    }
    navigate('/purchase/orders/export', { state: { ids: exportIds } });
  };

  // --- 分页计算 ---
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(orders.length / pageSize) || 1;

  // --- 状态徽章渲染配置 ---
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const config: Record<PurchaseOrderStatus, { label: string; classes: string }> = {
      DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
      PENDING_AUDIT: { label: '待审核', classes: 'bg-orange-50 text-orange-700 border border-orange-200' },
      PENDING_STOCK_IN: { label: '待入库', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
      PARTIAL_STOCK_IN: { label: '部分入库', classes: 'bg-sky-50 text-sky-700 border border-sky-200' },
      COMPLETED: { label: '已完成', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
    };
    const item = config[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.classes}`}>
        {item.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 头部标题区 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-800">采购订单管理</h1>
          <p className="text-xs text-slate-500 mt-1">采购业务的起点，控制向供应商买什么、买多少、买什么价，并支持流转到入库执行。</p>
        </div>
        <Button onClick={() => navigate('/purchase/orders/new')} className="flex items-center gap-1.5 font-semibold text-sm">
          <Plus size={16} />
          新建采购订单
        </Button>
      </div>

      {/* 状态 Tab 栏 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
          {[
            { key: 'ALL', label: '全部' },
            { key: 'DRAFT', label: '草稿' },
            { key: 'PENDING_AUDIT', label: '待审核' },
            { key: 'PENDING_STOCK_IN', label: '待入库' },
            { key: 'PARTIAL_STOCK_IN', label: '部分入库' },
            { key: 'COMPLETED', label: '已完成' },
            { key: 'VOIDED', label: '已作废' }
          ].map(tab => {
            const count = tabCounts[tab.key] ?? 0;
            const countText = count > 99 ? '99+' : count;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all rounded-md cursor-pointer ${
                  isActive 
                    ? 'bg-white text-primary shadow-sm border-b border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`inline-block px-1.5 py-0.2 text-xs rounded-full ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200/80 text-slate-500'
                }`}>
                  {countText}
                </span>
              </button>
            );
          })}
        </div>

        {/* 查询区 */}
        <form onSubmit={handleSearch} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">采购单号</label>
              <Input 
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                placeholder="多单号以换行或逗号分隔"
                className="h-9 text-xs"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">供应商</label>
              <select
                value={supplierCode}
                onChange={e => setSupplierCode(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">全部供应商</option>
                {MOCK_SUPPLIERS.map(s => (
                  <option key={s.code} value={s.code}>{s.code} {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">入库仓库</label>
              <select
                value={warehouseCode}
                onChange={e => setWarehouseCode(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">全部仓库</option>
                {MOCK_WAREHOUSES.map(w => (
                  <option key={w.code} value={w.code}>{w.code} {w.name}</option>
                ))}
              </select>
            </div>

            {/* 仅在“全部” Tab 下展示订单状态筛选，具体状态 Tab 隐藏状态 Filter */}
            {activeTab === 'ALL' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">订单状态</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ALL">全部状态</option>
                  <option value="DRAFT">草稿</option>
                  <option value="PENDING_AUDIT">待审核</option>
                  <option value="PENDING_STOCK_IN">待入库</option>
                  <option value="PARTIAL_STOCK_IN">部分入库</option>
                  <option value="COMPLETED">已完成</option>
                  <option value="VOIDED">已作废</option>
                </select>
              </div>
            ) : (
              <div className="hidden lg:block lg:opacity-0 lg:pointer-events-none"></div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">下单日期</label>
              <div className="flex items-center gap-1">
                <Input 
                  type="date"
                  value={orderDateStart}
                  onChange={e => setOrderDateStart(e.target.value)}
                  className="h-9 text-xs py-1"
                />
                <span className="text-slate-400 text-xs">至</span>
                <Input 
                  type="date"
                  value={orderDateEnd}
                  onChange={e => setOrderDateEnd(e.target.value)}
                  className="h-9 text-xs py-1"
                />
              </div>
            </div>
          </div>

          {/* 展开的更多筛选条件 */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 border-t border-dashed border-slate-100 pt-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">预计到货日期</label>
                <div className="flex items-center gap-1">
                  <Input 
                    type="date"
                    value={expectedDateStart}
                    onChange={e => setExpectedDateStart(e.target.value)}
                    className="h-9 text-xs py-1"
                  />
                  <span className="text-slate-400 text-xs">至</span>
                  <Input 
                    type="date"
                    value={expectedDateEnd}
                    onChange={e => setExpectedDateEnd(e.target.value)}
                    className="h-9 text-xs py-1"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">最后修改时间</label>
                <div className="flex items-center gap-1">
                  <Input 
                    type="date"
                    value={updatedDateStart}
                    onChange={e => setUpdatedDateStart(e.target.value)}
                    className="h-9 text-xs py-1"
                  />
                  <span className="text-slate-400 text-xs">至</span>
                  <Input 
                    type="date"
                    value={updatedDateEnd}
                    onChange={e => setUpdatedDateEnd(e.target.value)}
                    className="h-9 text-xs py-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮组 */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              {isExpanded ? (
                <>收起高级筛选 <ChevronUp size={14} /></>
              ) : (
                <>展开高级筛选 <ChevronDown size={14} /></>
              )}
            </button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleReset} size="sm" className="flex items-center gap-1">
                <RotateCcw size={14} />
                重置
              </Button>
              <Button type="submit" size="sm" className="flex items-center gap-1 font-semibold">
                <Search size={14} />
                搜索
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* 列表卡片 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {/* 工具条 */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">已选 {selectedIds.length} 项</span>
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1 h-8 text-xs">
              <Download size={14} />
              批量导出
            </Button>
          </div>
          <div className="text-xs text-slate-500">
            共 <span className="font-bold text-slate-800">{orders.length}</span> 条记录
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedIds.includes(o.id))}
                    className="rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="p-3 font-semibold w-40">采购单号</th>
                <th className="p-3 font-semibold">供应商</th>
                <th className="p-3 font-semibold">入库仓库</th>
                <th className="p-3 font-semibold">下单日期</th>
                <th className="p-3 font-semibold">预计到货</th>
                <th className="p-3 font-semibold text-center">订单状态</th>
                <th className="p-3 font-semibold w-24">商品种数</th>
                <th className="p-3 font-semibold text-right">采购总金额</th>
                <th className="p-3 font-semibold">最后修改时间</th>
                <th className="p-3 font-semibold text-center w-36">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map(order => {
                  const isChecked = selectedIds.includes(order.id);
                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isChecked ? 'bg-primary/5 hover:bg-primary/5' : ''}`}
                      onClick={() => navigate(`/purchase/orders/${order.id}`)}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={e => handleSelectRow(order.id, e.target.checked)}
                          className="rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-semibold text-primary hover:underline">
                        {order.id}
                      </td>
                      <td className="p-3 text-slate-700 max-w-[200px] truncate">
                        <span className="font-semibold text-slate-500 mr-1.5">[{order.supplierCode}]</span>
                        {order.supplierName}
                      </td>
                      <td className="p-3 text-slate-700">
                        <span className="font-semibold text-slate-500 mr-1.5">[{order.warehouseCode}]</span>
                        {order.warehouseName}
                      </td>
                      <td className="p-3 text-slate-600">{order.orderDate}</td>
                      <td className="p-3 text-slate-600">{order.expectedDeliveryDate || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          {getStatusBadge(order.status)}
                          <WmsStatusTag poId={order.id} />
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{order.itemCount} 种</td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        ¥{order.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-slate-500">{order.updatedAt || order.createdAt}</td>
                      <td className="p-3 text-center space-x-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/purchase/orders/${order.id}`)}
                          className="inline-flex items-center gap-0.5 p-1 text-slate-600 hover:text-primary transition-colors cursor-pointer font-medium"
                          title="查看详情"
                        >
                          <Eye size={14} />
                          <span>查看</span>
                        </button>
                        
                        {order.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => navigate(`/purchase/orders/${order.id}/edit`)}
                              className="inline-flex items-center gap-0.5 p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer font-medium"
                              title="编辑"
                            >
                              <Edit size={14} />
                              <span>编辑</span>
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'SUBMIT',
                                title: '提交审核',
                                msg: '提交后单据将进入待审核状态，确认提交？',
                                orderId: order.id
                              })}
                              className="inline-flex items-center gap-0.5 p-1 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer font-medium"
                              title="提交审核"
                            >
                              <span>提交审核</span>
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'DELETE',
                                title: '确认删除',
                                msg: '删除后不可恢复，该采购订单将从系统中永久移除，确认删除？',
                                orderId: order.id
                              })}
                              className="inline-flex items-center gap-0.5 p-1 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer font-medium"
                              title="删除"
                            >
                              <Trash2 size={14} />
                              <span>删除</span>
                            </button>
                          </>
                        )}
                        
                        {order.status === 'PENDING_AUDIT' && (
                          <>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'APPROVE',
                                title: '确认审核',
                                msg: '审核通过后关键字段将锁定，不可再修改，确认审核通过？',
                                orderId: order.id
                              })}
                              className="inline-flex items-center gap-0.5 p-1 text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer font-medium"
                              title="审核"
                            >
                              <span>审核</span>
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'REJECT',
                                title: '确认驳回',
                                msg: '驳回后单据将退回草稿，采购员可重新修改，确认驳回？',
                                orderId: order.id
                              })}
                              className="inline-flex items-center gap-0.5 p-1 text-amber-600 hover:text-amber-800 transition-colors cursor-pointer font-medium"
                              title="驳回"
                            >
                              <span>驳回</span>
                            </button>
                            <button
                              onClick={(e) => handleVoidClick(order.id, e)}
                              className="inline-flex items-center gap-0.5 p-1 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer font-medium"
                              title="作废"
                            >
                              <XCircle size={14} />
                              <span>作废</span>
                            </button>
                          </>
                        )}

                        {order.status === 'PENDING_STOCK_IN' && (
                          <>
                            <button
                              onClick={() => navigate(`/purchase/receipts/new?source_id=${order.id}`)}
                              className="inline-flex items-center gap-0.5 p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer font-medium"
                              title="创建入库单"
                            >
                              <span>创建入库单</span>
                            </button>
                            <button
                              onClick={(e) => handleVoidClick(order.id, e)}
                              className="inline-flex items-center gap-0.5 p-1 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer font-medium"
                              title="作废"
                            >
                              <XCircle size={14} />
                              <span>作废</span>
                            </button>
                          </>
                        )}

                        {order.status === 'PARTIAL_STOCK_IN' && (
                          <>
                            <button
                              onClick={() => navigate(`/purchase/receipts/new?source_id=${order.id}`)}
                              className="inline-flex items-center gap-0.5 p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer font-medium"
                              title="创建入库单"
                            >
                              <span>创建入库单</span>
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'CLOSE',
                                title: '确认关闭',
                                msg: '关闭后将不可继续办理入库作业，该订单已入库的明细仍然有效，确认强行关闭？',
                                orderId: order.id
                              })}
                              className="inline-flex items-center gap-0.5 p-1 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer font-medium"
                              title="关闭订单"
                            >
                              <span>关闭订单</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-sm font-semibold">暂无数据</div>
                      <div className="text-xs">未找到符合当前筛选条件的采购订单记录</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 底部分页 */}
        {orders.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50/20 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>每页显示</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded p-1 text-xs"
              >
                <option value={10}>10 条</option>
                <option value={20}>20 条</option>
                <option value={50}>50 条</option>
                <option value={100}>100 条</option>
              </select>
              <span>当前第 {currentPage} 页 / 共 {totalPages} 页</span>
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="h-7 text-xs px-2"
              >
                首页
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="h-7 text-xs px-2"
              >
                上一页
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="h-7 text-xs px-2"
              >
                下一页
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                className="h-7 text-xs px-2"
              >
                尾页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 作废二次确认弹窗 */}
      {voidingId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-800">确认作废采购订单</h3>
              <p className="text-xs text-slate-500 mt-1">作废单据编号：<span className="font-semibold text-slate-700">{voidingId}</span></p>
              <p className="text-xs text-rose-500 mt-1 font-semibold">⚠️ 警告：订单作废后将无法恢复，且不可再用于执行入库操作！</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">作废原因 <span className="text-rose-500">*</span></label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="请输入作废此单据的原因..."
                rows={3}
                required
                className="w-full text-xs p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <Button variant="outline" size="sm" onClick={() => setVoidingId(null)}>
                取消
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleConfirmVoid} 
                disabled={!voidReason.trim()}
                className="font-semibold"
              >
                确认作废
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 二次确认弹窗 */}
      {confirmAction.type !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-800">{confirmAction.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{confirmAction.msg}</p>
            </div>
            
            <div className="flex justify-end gap-2 text-xs pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction({ type: null, title: '', msg: '', orderId: null })}>
                取消
              </Button>
              <Button 
                variant={confirmAction.type === 'DELETE' || confirmAction.type === 'REJECT' ? 'destructive' : 'default'}
                size="sm" 
                onClick={() => handleAction(confirmAction.type, confirmAction.orderId)}
                className="font-semibold"
              >
                {confirmAction.type === 'DELETE' ? '确认删除' :
                 confirmAction.type === 'SUBMIT' ? '确认提交' :
                 confirmAction.type === 'APPROVE' ? '确认审核' :
                 confirmAction.type === 'REJECT' ? '确认驳回' :
                 confirmAction.type === 'CLOSE' ? '确认关闭' : '确认作废'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
