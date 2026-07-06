import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseReturn, PurchaseReturnStatus } from '../types/purchaseReturn';
import { purchaseReturnApi } from '../api/purchaseReturn';
import { MOCK_WAREHOUSES } from '../api/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Search, RotateCcw, Download, Eye, Edit3, Trash2, 
  XCircle, CheckCircle, ArrowRightLeft 
} from 'lucide-react';

export default function PurchaseReturnList() {
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [activeTab, setActiveTab] = useState<PurchaseReturnStatus | 'ALL'>('ALL');
  const [prNumber, setPrNumber] = useState('');
  const [sourceStockInId, setSourceStockInId] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [returnDateStart, setReturnDateStart] = useState('');
  const [returnDateEnd, setReturnDateEnd] = useState('');

  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExpandFilter, setIsExpandFilter] = useState(false);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 二次确认框
  const [confirmAction, setConfirmAction] = useState<{
    type: 'CONFIRM' | 'VOID' | 'DELETE' | null;
    title: string;
    msg: string;
    targetId: string | null;
  }>({ type: null, title: '', msg: '', targetId: null });

  // --- 获取数据与计数 ---
  const loadData = () => {
    const filters = {
      status: activeTab === 'ALL' ? undefined : activeTab,
      prNumber,
      sourceStockInId,
      supplierCode,
      warehouseCode,
      returnDateStart,
      returnDateEnd
    };
    const res = purchaseReturnApi.getReturns(filters);
    setReturns(res);
  };

  useEffect(() => {
    loadData();
    setSelectedIds([]);
  }, [activeTab, prNumber, sourceStockInId, supplierCode, warehouseCode, returnDateStart, returnDateEnd]);

  // Tab 计数
  const getTabCount = (tab: PurchaseReturnStatus | 'ALL') => {
    const list = purchaseReturnApi.getReturns();
    if (tab === 'ALL') return list.length;
    return list.filter(x => x.status === tab).length;
  };

  // --- 交互处理 ---
  const handleReset = () => {
    setPrNumber('');
    setSourceStockInId('');
    setSupplierCode('');
    setWarehouseCode('');
    setReturnDateStart('');
    setReturnDateEnd('');
  };

  const handleExport = () => {
    if (returns.length === 0) return;
    alert(`成功导出 ${returns.length} 条采购退货单数据！`);
  };

  // 批量/行内操作
  const handleAction = (type: 'CONFIRM' | 'VOID' | 'DELETE', id: string) => {
    try {
      if (type === 'CONFIRM') {
        purchaseReturnApi.confirmReturn(id);
        alert('退货单确认成功');
      } else if (type === 'VOID') {
        purchaseReturnApi.voidReturn(id);
        alert('退货单已成功作废');
      } else if (type === 'DELETE') {
        purchaseReturnApi.deleteReturn(id);
        alert('草稿已成功删除');
      }
      loadData();
      setConfirmAction({ type: null, title: '', msg: '', targetId: null });
    } catch (e: any) {
      alert(e.message || '操作失败');
    }
  };

  const executeConfirmAction = () => {
    if (confirmAction.type && confirmAction.targetId) {
      handleAction(confirmAction.type, confirmAction.targetId);
    }
  };

  // 勾选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(returns.map(x => x.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // 分页计算
  const totalPages = Math.ceil(returns.length / pageSize) || 1;
  const paginatedReturns = returns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* 选项卡 Tab */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-t-lg shadow-sm">
        {(['ALL', 'DRAFT', 'CONFIRMED', 'VOIDED'] as const).map(tab => {
          const isActive = activeTab === tab;
          const label = tab === 'ALL' ? '全部' : tab === 'DRAFT' ? '草稿' : tab === 'CONFIRMED' ? '已确认' : '已作废';
          const count = getTabCount(tab);
          
          let colorClass = 'border-transparent text-slate-500 hover:text-slate-700';
          if (isActive) {
            if (tab === 'DRAFT') colorClass = 'border-emerald-500 text-emerald-600 font-bold';
            else if (tab === 'CONFIRMED') colorClass = 'border-primary text-primary font-bold';
            else if (tab === 'VOIDED') colorClass = 'border-rose-500 text-rose-600 font-bold';
            else colorClass = 'border-slate-800 text-slate-800 font-bold';
          }

          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${colorClass}`}
            >
              <span>{label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-slate-100' : 'bg-slate-50 text-slate-400'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* 查询卡片 */}
      <div className="bg-white p-6 rounded-b-lg shadow-sm border-x border-b border-slate-100 space-y-4">
        <form onSubmit={e => { e.preventDefault(); setCurrentPage(1); loadData(); }} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-500">退货单号</label>
            <Input value={prNumber} onChange={e => setPrNumber(e.target.value)} placeholder="PRYYYYMMDD-XXXX" className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500">来源入库单号</label>
            <Input value={sourceStockInId} onChange={e => setSourceStockInId(e.target.value)} placeholder="PIYYYYMMDD-XXXX" className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500">供应商编码/名称</label>
            <Input value={supplierCode} onChange={e => setSupplierCode(e.target.value)} placeholder="供应商编码或名称" className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500">仓库</label>
            <select
              value={warehouseCode}
              onChange={e => setWarehouseCode(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none"
            >
              <option value="">全部仓库</option>
              {MOCK_WAREHOUSES.map(w => (
                <option key={w.code} value={w.code}>{w.code} {w.name}</option>
              ))}
            </select>
          </div>

          {isExpandFilter && (
            <>
              <div className="space-y-1 col-span-1 md:col-span-2">
                <label className="font-semibold text-slate-500 block">退货日期范围</label>
                <div className="flex items-center gap-1">
                  <input type="date" value={returnDateStart} onChange={e => setReturnDateStart(e.target.value)} className="rounded-md border border-input px-2 h-9 text-xs flex-1 min-w-0" />
                  <span className="text-slate-400">至</span>
                  <input type="date" value={returnDateEnd} onChange={e => setReturnDateEnd(e.target.value)} className="rounded-md border border-input px-2 h-9 text-xs flex-1 min-w-0" />
                </div>
              </div>
            </>
          )}

          <div className="col-span-1 md:col-span-3 lg:col-span-4 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsExpandFilter(!isExpandFilter)}
              className="text-primary hover:underline font-bold text-xs"
            >
              {isExpandFilter ? '收起高级筛选' : '展开高级筛选'}
            </button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleReset} className="h-9 px-4 flex items-center gap-1 font-bold">
                <RotateCcw size={14} /> 重置
              </Button>
              <Button type="submit" className="h-9 px-4 flex items-center gap-1 font-bold">
                <Search size={14} /> 搜索
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* 数据列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {/* 工具栏 */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold">
            已勾选 {selectedIds.length} 项
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={returns.length === 0}
            onClick={handleExport}
            className="h-8 py-1.5 flex items-center gap-1 font-bold border-slate-200 disabled:opacity-40 bg-white"
          >
            <Download size={13} /> 导出
          </Button>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={returns.length > 0 && selectedIds.length === returns.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="p-3 w-40">退货单号</th>
                <th className="p-3 w-24 text-center">状态</th>
                <th className="p-3 w-40">来源入库单号</th>
                <th className="p-3">供应商</th>
                <th className="p-3 w-36">仓库</th>
                <th className="p-3 w-28">退货日期</th>
                <th className="p-3 w-24 text-right">商品种数</th>
                <th className="p-3 w-32 text-right">退货总金额</th>
                <th className="p-3 w-40">最后修改时间</th>
                <th className="p-3 w-48 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReturns.length > 0 ? (
                paginatedReturns.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/20">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rec.id)}
                        onChange={e => handleSelectRow(rec.id, e.target.checked)}
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-600">{rec.id}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        rec.status === 'DRAFT' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : rec.status === 'CONFIRMED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {rec.status === 'DRAFT' ? '草稿' : rec.status === 'CONFIRMED' ? '已确认' : '已作废'}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span
                        onClick={() => navigate(`/purchase/receipts/${rec.sourceStockInId}`)}
                        className="text-primary hover:underline cursor-pointer font-bold"
                      >
                        {rec.sourceStockInId}
                      </span>
                    </td>
                    <td className="p-3 font-semibold truncate max-w-[150px]" title={rec.supplierName}>
                      {rec.supplierName}
                    </td>
                    <td className="p-3 truncate max-w-[120px]" title={rec.warehouseName}>
                      {rec.warehouseName}
                    </td>
                    <td className="p-3 text-slate-500">{rec.returnDate}</td>
                    <td className="p-3 text-right font-bold">{rec.itemCount}</td>
                    <td className="p-3 text-right font-extrabold text-slate-800">
                      ¥{rec.totalAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-400 font-medium">{rec.updatedAt || rec.createdAt}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/purchase/returns/${rec.id}`)}
                          className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                          title="查看详情"
                        >
                          <Eye size={13} /> 查看
                        </button>

                        {/* 草稿态操作 */}
                        {rec.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => navigate(`/purchase/returns/${rec.id}/edit`)}
                              className="text-amber-600 hover:text-amber-700 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="编辑"
                            >
                              <Edit3 size={13} /> 编辑
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'CONFIRM',
                                title: '确认退货',
                                msg: '确认后单据将被锁定，正式进入库房退货出库执行阶段。是否确认？',
                                targetId: rec.id
                              })}
                              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="确认"
                            >
                              <CheckCircle size={13} /> 确认
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'VOID',
                                title: '作废退货单',
                                msg: '作废后单据将无法修改或下推。是否作废该退货单？',
                                targetId: rec.id
                              })}
                              className="text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="作废"
                            >
                              <XCircle size={13} /> 作废
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'DELETE',
                                title: '物理删除草稿',
                                msg: '删除后无法恢复，确认删除该退货单草稿？',
                                targetId: rec.id
                              })}
                              className="text-slate-400 hover:text-slate-600 flex items-center gap-0.5 cursor-pointer font-bold"
                              title="物理删除"
                            >
                              <Trash2 size={13} /> 删除
                            </button>
                          </>
                        )}

                        {/* 已确认态操作：下推退货出库 */}
                        {rec.status === 'CONFIRMED' && (
                          <button
                            onClick={() => navigate(`/purchase/return-outbounds/new?source_id=${rec.id}`)}
                            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer font-bold"
                            title="下推退货出库单"
                          >
                            <ArrowRightLeft size={13} /> 出库
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium bg-white">
                    没有符合条件的采购退货单记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500 bg-slate-50/50">
          <span>共 {returns.length} 条记录，当前第 {currentPage} / {totalPages} 页</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="h-8 text-xs font-bold disabled:opacity-40 border-slate-200 bg-white"
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="h-8 text-xs font-bold disabled:opacity-40 border-slate-200 bg-white"
            >
              下一页
            </Button>
          </div>
        </div>
      </div>

      {/* 二次确认框 */}
      {confirmAction.type && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                {confirmAction.type === 'CONFIRM' && <CheckCircle className="text-emerald-500" size={18} />}
                {confirmAction.type === 'VOID' && <XCircle className="text-rose-500" size={18} />}
                {confirmAction.type === 'DELETE' && <Trash2 className="text-slate-400" size={18} />}
                {confirmAction.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {confirmAction.msg}
              </p>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <Button variant="outline" onClick={() => setConfirmAction({ type: null, title: '', msg: '', targetId: null })} className="h-8 py-1">
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
