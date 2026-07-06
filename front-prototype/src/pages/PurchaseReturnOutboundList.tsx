import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseReturnOutbound, PurchaseReturnOutboundStatus } from '../types/purchaseReturnOutbound';
import { purchaseReturnOutboundApi } from '../api/purchaseReturnOutbound';
import { MOCK_WAREHOUSES } from '../api/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Search, RotateCcw, Download, Eye, Edit3, Trash2, 
  XCircle, CheckCircle 
} from 'lucide-react';

export default function PurchaseReturnOutboundList() {
  const navigate = useNavigate();

  // --- 状态 ---
  const [activeTab, setActiveTab] = useState<PurchaseReturnOutboundStatus | 'ALL'>('ALL');
  const [proNumber, setProNumber] = useState('');
  const [sourceReturnId, setSourceReturnId] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [outboundDateStart, setOutboundDateStart] = useState('');
  const [outboundDateEnd, setOutboundDateEnd] = useState('');

  const [outbounds, setOutbounds] = useState<PurchaseReturnOutbound[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExpandFilter, setIsExpandFilter] = useState(false);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 二次确认
  const [confirmAction, setConfirmAction] = useState<{
    type: 'CONFIRM' | 'VOID' | 'DELETE' | null;
    title: string;
    msg: string;
    targetId: string | null;
  }>({ type: null, title: '', msg: '', targetId: null });

  const loadData = () => {
    const filters = {
      status: activeTab === 'ALL' ? undefined : activeTab,
      proNumber,
      sourceReturnId,
      supplierCode,
      warehouseCode,
      outboundDateStart,
      outboundDateEnd
    };
    const res = purchaseReturnOutboundApi.getOutbounds(filters);
    setOutbounds(res);
  };

  useEffect(() => {
    loadData();
    setSelectedIds([]);
  }, [activeTab, proNumber, sourceReturnId, supplierCode, warehouseCode, outboundDateStart, outboundDateEnd]);

  const getTabCount = (tab: PurchaseReturnOutboundStatus | 'ALL') => {
    const list = purchaseReturnOutboundApi.getOutbounds();
    if (tab === 'ALL') return list.length;
    return list.filter(x => x.status === tab).length;
  };

  const handleReset = () => {
    setProNumber('');
    setSourceReturnId('');
    setSupplierCode('');
    setWarehouseCode('');
    setOutboundDateStart('');
    setOutboundDateEnd('');
  };

  const handleExport = () => {
    if (outbounds.length === 0) return;
    alert(`成功导出 ${outbounds.length} 条退货出库单数据！`);
  };

  const handleAction = (type: 'CONFIRM' | 'VOID' | 'DELETE', id: string) => {
    try {
      if (type === 'CONFIRM') {
        purchaseReturnOutboundApi.confirmOutbound(id);
        alert('确认出库成功，已扣减库存且生成负向应付款记录');
      } else if (type === 'VOID') {
        purchaseReturnOutboundApi.voidOutbound(id);
        alert('退货出库单已作废');
      } else if (type === 'DELETE') {
        purchaseReturnOutboundApi.deleteOutbound(id);
        alert('出库单草稿已物理删除');
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
            <label className="font-semibold text-slate-500">出库单号</label>
            <Input value={proNumber} onChange={e => setProNumber(e.target.value)} placeholder="PROYYYYMMDD-XXXX" className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500">来源退货单号</label>
            <Input value={sourceReturnId} onChange={e => setSourceReturnId(e.target.value)} placeholder="PRYYYYMMDD-XXXX" className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500">供应商编码/名称</label>
            <Input value={supplierCode} onChange={e => setSupplierCode(e.target.value)} placeholder="供应商编码或名称" className="h-9 text-xs" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-500">出库仓库</label>
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
            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="font-semibold text-slate-500 block">出库日期范围</label>
              <div className="flex items-center gap-1">
                <input type="date" value={outboundDateStart} onChange={e => setOutboundDateStart(e.target.value)} className="rounded-md border border-input px-2 h-9 text-xs flex-1 min-w-0" />
                <span className="text-slate-400">至</span>
                <input type="date" value={outboundDateEnd} onChange={e => setOutboundDateEnd(e.target.value)} className="rounded-md border border-input px-2 h-9 text-xs flex-1 min-w-0" />
              </div>
            </div>
          )}

          <div className="col-span-1 md:col-span-3 lg:col-span-4 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsExpandFilter(!isExpandFilter)}
              className="text-primary hover:underline font-bold text-xs animate-pulse"
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

      {/* 列表表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {/* 工具栏 */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold">
            已选择 {selectedIds.length} 项
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={outbounds.length === 0}
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
                    checked={outbounds.length > 0 && selectedIds.length === outbounds.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedIds(outbounds.map(x => x.id));
                      else setSelectedIds([]);
                    }}
                  />
                </th>
                <th className="p-3 w-40">出库单号</th>
                <th className="p-3 w-24 text-center">状态</th>
                <th className="p-3 w-40">来源退货单号</th>
                <th className="p-3">供应商</th>
                <th className="p-3 w-36">出库仓库</th>
                <th className="p-3 w-28">出库日期</th>
                <th className="p-3 w-24 text-right">商品种数</th>
                <th className="p-3 w-32 text-right">出库总金额</th>
                <th className="p-3 w-40">最后修改时间</th>
                <th className="p-3 w-44 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outbounds.length > 0 ? (
                outbounds.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/20">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rec.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedIds(prev => [...prev, rec.id]);
                          else setSelectedIds(prev => prev.filter(x => x !== rec.id));
                        }}
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
                        onClick={() => navigate(`/purchase/returns/${rec.sourceReturnId}`)}
                        className="text-primary hover:underline cursor-pointer font-bold"
                      >
                        {rec.sourceReturnId}
                      </span>
                    </td>
                    <td className="p-3 font-semibold truncate max-w-[150px]" title={rec.supplierName}>
                      {rec.supplierName}
                    </td>
                    <td className="p-3 truncate max-w-[120px]" title={rec.warehouseName}>
                      {rec.warehouseName}
                    </td>
                    <td className="p-3 text-slate-500">{rec.outboundDate}</td>
                    <td className="p-3 text-right font-bold">{rec.itemCount}</td>
                    <td className="p-3 text-right font-extrabold text-slate-800">
                      ¥{rec.totalAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-400 font-medium">{rec.updatedAt || rec.createdAt}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/purchase/return-outbounds/${rec.id}`)}
                          className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                        >
                          <Eye size={13} /> 查看
                        </button>

                        {/* 草稿操作 */}
                        {rec.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => navigate(`/purchase/return-outbounds/${rec.id}/edit`)}
                              className="text-amber-600 hover:text-amber-700 flex items-center gap-0.5 cursor-pointer font-bold"
                            >
                              <Edit3 size={13} /> 编辑
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'CONFIRM',
                                title: '确认发货出库',
                                msg: '确认出库后将扣减即时库存，冲减财务应付款并生成库存发货流水。确认继续？',
                                targetId: rec.id
                              })}
                              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer font-bold"
                            >
                              <CheckCircle size={13} /> 确认
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'VOID',
                                title: '作废出库单',
                                msg: '作废后该出库单永久失效。是否确定作废？',
                                targetId: rec.id
                              })}
                              className="text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer font-bold"
                            >
                              <XCircle size={13} /> 作废
                            </button>
                            <button
                              onClick={() => setConfirmAction({
                                type: 'DELETE',
                                title: '删除出库单草稿',
                                msg: '物理删除后不可恢复。确认删除？',
                                targetId: rec.id
                              })}
                              className="text-slate-400 hover:text-slate-600 flex items-center gap-0.5 cursor-pointer font-bold"
                            >
                              <Trash2 size={13} /> 删除
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium bg-white">
                    没有符合条件的采购退货出库单记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 二次确认对话框 */}
      {confirmAction.type && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4">
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
