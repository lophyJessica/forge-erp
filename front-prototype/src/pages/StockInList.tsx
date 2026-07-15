import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockIn, StockInStatus } from '../types/stockIn';
import { stockInApi } from '../api/stockIn';
import { MOCK_SUPPLIERS, MOCK_WAREHOUSES } from '../api/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import PageTitle from '../components/shared/PageTitle';
import FilterForm from '../components/shared/FilterForm';
import DataTable from '../components/shared/DataTable';
import Pagination from '../components/shared/Pagination';
import StatusTabs from '../components/shared/StatusTabs';
import { 
  Eye, Edit, Trash2, XCircle, Search, RotateCcw, 
  ChevronDown, ChevronUp, Download, CheckCircle, ArrowRightLeft
} from 'lucide-react';

export default function StockInList() {
  const navigate = useNavigate();

  // --- 状态定义 ---
  const [activeTab, setActiveTab] = useState<StockInStatus | 'ALL'>('ALL');
  const [receipts, setReceipts] = useState<StockIn[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 筛选条件状态
  const [piNumber, setPiNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockInStatus | 'ALL'>('ALL');
  const [stockInDateStart, setStockInDateStart] = useState('');
  const [stockInDateEnd, setStockInDateEnd] = useState('');
  const [updatedDateStart, setUpdatedDateStart] = useState('');
  const [updatedDateEnd, setUpdatedDateEnd] = useState('');

  // 展开折叠高级筛选
  const [isExpanded, setIsExpanded] = useState(false);

  // 二次确认弹窗状态
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE' | 'VOID' | 'CONFIRM' | null;
    title: string;
    msg: string;
    targetId: string | null;
  }>({ type: null, title: '', msg: '', targetId: null });

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 各状态数量计数
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // --- 数据加载 ---
  const loadData = () => {
    const currentStatus = activeTab === 'ALL' ? (statusFilter === 'ALL' ? '' : statusFilter) : activeTab;
    
    const res = stockInApi.getStockIns({
      status: currentStatus as any,
      piNumber,
      poNumber,
      supplierCode,
      warehouseCode,
      stockInDateStart,
      stockInDateEnd,
      updatedDateStart: isExpanded ? updatedDateStart : '',
      updatedDateEnd: isExpanded ? updatedDateEnd : '',
    });

    setReceipts(res);
    setSelectedIds([]);

    // 重新计算 Tab 计数
    const counts: Record<string, number> = {};
    const statuses: (StockInStatus | 'ALL')[] = ['ALL', 'DRAFT', 'CONFIRMED', 'VOIDED'];
    statuses.forEach(st => {
      const tempRes = stockInApi.getStockIns({
        status: st === 'ALL' ? '' : st,
        piNumber,
        poNumber,
        supplierCode,
        warehouseCode,
        stockInDateStart,
        stockInDateEnd,
        updatedDateStart: isExpanded ? updatedDateStart : '',
        updatedDateEnd: isExpanded ? updatedDateEnd : '',
      });
      counts[st] = tempRes.length;
    });
    setTabCounts(counts);
  };

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter, supplierCode, warehouseCode, stockInDateStart, stockInDateEnd, updatedDateStart, updatedDateEnd, isExpanded]);

  // --- 交互处理 ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleReset = () => {
    setPiNumber('');
    setPoNumber('');
    setSupplierCode('');
    setWarehouseCode('');
    setStatusFilter('ALL');
    setStockInDateStart('');
    setStockInDateEnd('');
    setUpdatedDateStart('');
    setUpdatedDateEnd('');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(receipts.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // --- 状态操作处理 ---
  const openConfirmDialog = (type: 'DELETE' | 'VOID' | 'CONFIRM', id: string) => {
    if (type === 'DELETE') {
      setConfirmAction({
        type: 'DELETE',
        title: '确认删除',
        msg: '删除后不可恢复，该草稿入库单将从系统中永久移除，确认删除？',
        targetId: id
      });
    } else if (type === 'VOID') {
      setConfirmAction({
        type: 'VOID',
        title: '确认作废',
        msg: '作废后不可恢复，单据将进入已作废状态，确认作废？',
        targetId: id
      });
    } else if (type === 'CONFIRM') {
      setConfirmAction({
        type: 'CONFIRM',
        title: '确认入库',
        msg: '确认后实物将正式计入库存并形成财务应付，确认入库？',
        targetId: id
      });
    }
  };

  const executeConfirmAction = () => {
    const { type, targetId } = confirmAction;
    if (!targetId || !type) return;

    try {
      if (type === 'DELETE') {
        stockInApi.deleteStockIn(targetId);
        alert('采购入库单已删除');
      } else if (type === 'VOID') {
        stockInApi.voidStockIn(targetId);
        alert('单据已作废');
      } else if (type === 'CONFIRM') {
        stockInApi.confirmStockIn(targetId);
        alert('确认入库成功，库存已更新，应付款已生成');
      }
      setConfirmAction({ type: null, title: '', msg: '', targetId: null });
      loadData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  // 模拟导出数据
  const handleExport = () => {
    alert(`成功导出 ${receipts.length} 条采购入库单数据！`);
  };

  // 状态 Badge 颜色配置
  const getStatusBadge = (status: StockInStatus) => {
    const config: Record<StockInStatus, { label: string; classes: string }> = {
      DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
      CONFIRMED: { label: '已确认', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
    };
    const item = config[status];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${item.classes}`}>
        {item.label}
      </span>
    );
  };

  // 分页计算
  const paginatedReceipts = receipts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <PageTitle
        compact
        title="采购入库单"
        description="承接采购订单的收货结果，确认后更新库存并生成应付结算依据。"
        actions={(
          <Button type="button" onClick={() => navigate('/purchase/receipts/new')} className="flex items-center gap-1.5">
            <ArrowRightLeft size={15} />
            新建入库单
          </Button>
        )}
      />

      {/* 状态 Tab */}
      <StatusTabs
        className="rounded-lg shadow-sm"
        items={([
          { key: 'ALL', label: '全部' },
          { key: 'DRAFT', label: '草稿' },
          { key: 'CONFIRMED', label: '已确认' },
          { key: 'VOIDED', label: '已作废' },
        ] as const).map(tab => ({ ...tab, count: tabCounts[tab.key] || 0 }))}
        activeKey={activeTab}
        onChange={key => {
          setActiveTab(key as StockInStatus | 'ALL');
          setCurrentPage(1);
        }}
        ariaLabel="采购入库单状态筛选"
      />

      {/* 搜索与过滤面板 */}
      <FilterForm onSubmit={handleSearch} className="!p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. 入库单号 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">入库单号</label>
              <Input 
                value={piNumber} 
                onChange={e => setPiNumber(e.target.value)} 
                placeholder="支持入库单号模糊查询"
                className="h-9 text-xs"
              />
            </div>

            {/* 2. 来源采购单号 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">来源采购单号</label>
              <Input 
                value={poNumber} 
                onChange={e => setPoNumber(e.target.value)} 
                placeholder="支持采购单号模糊查询"
                className="h-9 text-xs"
              />
            </div>

            {/* 3. 供应商 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">供应商</label>
              <select
                value={supplierCode}
                onChange={e => setSupplierCode(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部供应商</option>
                {MOCK_SUPPLIERS.map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 4. 入库仓库 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">入库仓库</label>
              <select
                value={warehouseCode}
                onChange={e => setWarehouseCode(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部仓库</option>
                {MOCK_WAREHOUSES.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* 5. 状态（仅在 Tab 为 全部 时有效，Tab 为其它时置灰或隐藏） */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">入库状态</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                disabled={activeTab !== 'ALL'}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="ALL">全部状态</option>
                <option value="DRAFT">草稿</option>
                <option value="CONFIRMED">已确认</option>
                <option value="VOIDED">已作废</option>
              </select>
            </div>

            {/* 6. 入库日期 */}
            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="font-semibold text-slate-500 block">入库日期</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={stockInDateStart}
                  onChange={e => setStockInDateStart(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1"
                />
                <span className="text-slate-400">至</span>
                <input
                  type="date"
                  value={stockInDateEnd}
                  onChange={e => setStockInDateEnd(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1"
                />
              </div>
            </div>

            {/* 控制展开折叠的占位 */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-semibold py-2 cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <span>收起高级筛选</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>展开高级筛选</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 展开的高级筛选：最后修改时间 */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
              <div className="space-y-1 col-span-2">
                <label className="font-semibold text-slate-500 block">最后修改时间</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={updatedDateStart}
                    onChange={e => setUpdatedDateStart(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="date"
                    value={updatedDateEnd}
                    onChange={e => setUpdatedDateEnd(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 搜索控制区 */}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-9 px-4 text-xs flex items-center gap-1.5 font-bold"
            >
              <RotateCcw size={14} />
              重置
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 text-xs flex items-center gap-1.5 font-bold"
            >
              <Search size={14} />
              搜索
            </Button>
          </div>
      </FilterForm>

      {/* 数据列表和工具条 */}
      <DataTable minWidth="1320px">
        {/* 工具栏 */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <span className="text-xs text-slate-500 font-bold bg-slate-200/50 px-2.5 py-1 rounded">
                已选中 {selectedIds.length} 项
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 py-1.5 text-xs flex items-center gap-1 font-bold border-slate-200"
            >
              <Download size={13} />
              导出
            </Button>
          </div>
        </div>

        {/* 列表表格 */}
        <div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={receipts.length > 0 && selectedIds.length === receipts.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded text-primary focus:ring-primary cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="p-3 w-44">入库单号</th>
                <th className="p-3 w-28 text-center">状态</th>
                <th className="p-3 w-40">来源采购单号</th>
                <th className="p-3">供应商</th>
                <th className="p-3 w-32">仓库</th>
                <th className="p-3 w-28">入库日期</th>
                <th className="p-3 text-right w-24">商品种数</th>
                <th className="p-3 text-right w-28">入库总数量</th>
                <th className="p-3 text-right w-28">入库总金额</th>
                <th className="p-3 w-40">最后修改时间</th>
                <th className="p-3 text-center w-52">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedReceipts.length > 0 ? (
                paginatedReceipts.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rec.id)}
                        onChange={e => handleSelectOne(rec.id, e.target.checked)}
                        className="rounded text-primary focus:ring-primary cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="p-3">
                      <span 
                        onClick={() => navigate(`/purchase/receipts/${rec.id}`)}
                        className="font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {rec.id}
                      </span>
                    </td>
                    <td className="p-3 text-center">{getStatusBadge(rec.status)}</td>
                    <td className="p-3">
                      <span 
                        onClick={() => navigate(`/purchase/orders/${rec.purchaseOrderId}`)}
                        className="font-medium text-emerald-600 hover:underline cursor-pointer"
                      >
                        {rec.purchaseOrderId}
                      </span>
                    </td>
                    <td className="p-3 truncate max-w-[150px]" title={rec.supplierName}>
                      {rec.supplierName}
                    </td>
                    <td className="p-3 truncate max-w-[100px]" title={rec.warehouseName}>
                      {rec.warehouseName}
                    </td>
                    <td className="p-3 text-slate-500 font-semibold">{rec.stockInDate}</td>
                    <td className="p-3 text-right font-medium">{rec.itemCount} 种</td>
                    <td className="p-3 text-right font-bold">{rec.totalQuantity} 件</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      ¥{rec.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-slate-400 font-medium">
                      {rec.updatedAt || rec.createdAt}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* 所有人均可查看 */}
                        <button
                          onClick={() => navigate(`/purchase/receipts/${rec.id}`)}
                          className="text-primary hover:text-primary-focus flex items-center gap-0.5 cursor-pointer font-bold"
                          title="查看详情"
                        >
                          <Eye size={13} />
                          查看
                        </button>

                        {/* 草稿态：可编辑、确认入库、作废、物理删除 */}
                        {rec.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => navigate(`/purchase/receipts/${rec.id}/edit`)}
                              className="text-amber-600 hover:text-amber-700 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="编辑草稿"
                            >
                              <Edit size={13} />
                              编辑
                            </button>
                            <button
                              onClick={() => openConfirmDialog('CONFIRM', rec.id)}
                              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="确认入库生效"
                            >
                              <CheckCircle size={13} />
                              确认
                            </button>
                            <button
                              onClick={() => openConfirmDialog('VOID', rec.id)}
                              className="text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="作废"
                            >
                              <XCircle size={13} />
                              作废
                            </button>
                            <button
                              onClick={() => openConfirmDialog('DELETE', rec.id)}
                              className="text-slate-400 hover:text-slate-600 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="彻底删除"
                            >
                              <Trash2 size={13} />
                              删除
                            </button>
                          </>
                        )}

                        {/* 已确认：无额外操作 */}
                        {rec.status === 'CONFIRMED' && null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-medium bg-white">
                    没有符合条件的采购入库单记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </DataTable>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={receipts.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={nextPageSize => {
          setPageSize(nextPageSize);
          setCurrentPage(1);
        }}
      />

      {/* 二次确认对话框 */}
      {confirmAction.type && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                {confirmAction.type === 'DELETE' && <Trash2 className="text-rose-500" size={18} />}
                {confirmAction.type === 'VOID' && <XCircle className="text-rose-500" size={18} />}
                {confirmAction.type === 'CONFIRM' && <CheckCircle className="text-emerald-500" size={18} />}
                {confirmAction.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {confirmAction.msg}
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmAction({ type: null, title: '', msg: '', targetId: null })}
                className="h-8 py-1"
              >
                取消
              </Button>
              <Button
                variant={confirmAction.type === 'CONFIRM' ? 'default' : 'destructive'}
                onClick={executeConfirmAction}
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
