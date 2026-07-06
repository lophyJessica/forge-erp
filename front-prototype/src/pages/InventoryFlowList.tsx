import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryFlow } from '../types/stockIn';
import { stockInApi } from '../api/stockIn';
import { MOCK_PRODUCTS, MOCK_WAREHOUSES } from '../api/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, RotateCcw, Download, Eye, AlertCircle } from 'lucide-react';

export default function InventoryFlowList() {
  const navigate = useNavigate();

  // --- 筛选条件状态 ---
  const [warehouseCode, setWarehouseCode] = useState('');
  const [productCode, setProductCode] = useState('');
  const [changeType, setChangeType] = useState('');
  const [direction, setDirection] = useState<'IN' | 'OUT' | ''>('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sourceId, setSourceId] = useState('');

  // 列表数据
  const [flows, setFlows] = useState<InventoryFlow[]>([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 强控校验错误
  const [dateError, setDateError] = useState('');

  // --- 计算日期区间跨度 ---
  const checkDateRange = (start: string, end: string): boolean => {
    if (!start || !end) return false;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime < 0) {
      setDateError('结束日期不能早于开始日期');
      return true;
    }
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setDateError('查询日期跨度不能超过 365 天');
      return true;
    }
    setDateError('');
    return false;
  };

  useEffect(() => {
    checkDateRange(dateStart, dateEnd);
  }, [dateStart, dateEnd]);

  const isOverRange = !!dateError;

  // --- 数据加载 ---
  const loadData = () => {
    if (isOverRange) return;
    const res = stockInApi.getGlobalInventoryFlows({
      warehouseCode,
      productCode,
      changeType,
      direction,
      dateStart,
      dateEnd,
      sourceId,
    });
    setFlows(res);
  };

  useEffect(() => {
    loadData();
  }, [warehouseCode, productCode, changeType, direction, dateStart, dateEnd, isOverRange]);

  // --- 交互处理 ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverRange) return;
    setCurrentPage(1);
    loadData();
  };

  const handleReset = () => {
    setWarehouseCode('');
    setProductCode('');
    setChangeType('');
    setDirection('');
    setDateStart('');
    setDateEnd('');
    setSourceId('');
    setDateError('');
  };

  const handleExport = () => {
    if (isOverRange || flows.length === 0) return;
    alert(`成功导出 ${flows.length} 条库存收发流水台账数据！`);
  };

  // 变动类型映射渲染
  const getChangeTypeLabel = (type: InventoryFlow['changeType']) => {
    const maps: Record<InventoryFlow['changeType'], string> = {
      PI: '采购入库',
      PRO: '采购退货出库',
      SOO: '销售出库',
      SR: '销售退货入库',
      RS: '零售单成交',
      TR_OUT: '调拨出库',
      TR_IN: '调拨入库',
      BL: '报损出库',
      CK_IN: '盘盈入库',
      CK_OUT: '盘亏出库'
    };
    return maps[type] || type;
  };

  // 来源单号链接跳转处理
  const handleSourceLinkClick = (sId: string) => {
    if (sId.startsWith('PO')) {
      navigate(`/purchase/orders/${sId}`);
    } else if (sId.startsWith('PI')) {
      navigate(`/purchase/receipts/${sId}`);
    } else {
      alert(`单据【${sId}】为非采购业务单据，一期原型暂不支持跳转查看详情。`);
    }
  };

  // 分页计算
  const totalPages = Math.ceil(flows.length / pageSize) || 1;
  const paginatedFlows = flows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* 顶部标题区 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-800">库存收发流水台账</h1>
          <p className="text-xs text-slate-500 mt-1">系统全量收发审计日志，只读历史对账台账</p>
        </div>
      </div>

      {/* 复合搜索筛选区 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            {/* 1. 仓库 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">仓库</label>
              <select
                value={warehouseCode}
                onChange={e => setWarehouseCode(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部仓库</option>
                {MOCK_WAREHOUSES.map(w => (
                  <option key={w.code} value={w.code}>{w.code} {w.name}</option>
                ))}
              </select>
            </div>

            {/* 2. 商品 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">商品</label>
              <select
                value={productCode}
                onChange={e => setProductCode(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部商品</option>
                {MOCK_PRODUCTS.map(p => (
                  <option key={p.code} value={p.code}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>

            {/* 3. 单据类型 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">单据类型</label>
              <select
                value={changeType}
                onChange={e => setChangeType(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部类型</option>
                <option value="PI">采购入库</option>
                <option value="PRO">采购退货出库</option>
                <option value="SOO">销售出库</option>
                <option value="SR">销售退货入库</option>
                <option value="RS">零售单成交</option>
                <option value="TR_OUT">调拨出库</option>
                <option value="TR_IN">调拨入库</option>
                <option value="BL">报损出库</option>
                <option value="CK_IN">盘盈入库</option>
                <option value="CK_OUT">盘亏出库</option>
              </select>
            </div>

            {/* 4. 变动方向 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">变动方向</label>
              <select
                value={direction}
                onChange={e => setDirection(e.target.value as any)}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部方向</option>
                <option value="IN">入库 (+)</option>
                <option value="OUT">出库 (-)</option>
              </select>
            </div>

            {/* 5. 来源单号 */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">来源单号</label>
              <Input
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                placeholder="来源单据单号"
                className="h-9 text-xs"
              />
            </div>

            {/* 6. 日期范围 */}
            <div className="space-y-1 col-span-1 md:col-span-2 lg:col-span-1">
              <label className="font-semibold text-slate-500 block">
                发生日期
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateStart}
                  onChange={e => setDateStart(e.target.value)}
                  className={`rounded-md border ${
                    dateError ? 'border-rose-500 bg-rose-50/10' : 'border-input'
                  } bg-background px-2 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1 min-w-0`}
                />
                <span className="text-slate-400 font-bold">至</span>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={e => setDateEnd(e.target.value)}
                  className={`rounded-md border ${
                    dateError ? 'border-rose-500 bg-rose-50/10' : 'border-input'
                  } bg-background px-2 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1 min-w-0`}
                />
              </div>
            </div>
          </div>

          {/* 红色日期超限阻断报错提示 */}
          {dateError && (
            <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold bg-rose-50 border border-rose-100 rounded-md p-2.5">
              <AlertCircle size={14} />
              <span>{dateError}</span>
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
              disabled={isOverRange}
              className="h-9 px-4 text-xs flex items-center gap-1.5 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Search size={14} />
              搜索
            </Button>
          </div>
        </form>
      </div>

      {/* 数据列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {/* 工具栏 */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold">
            列表数据
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={isOverRange || flows.length === 0}
            onClick={handleExport}
            className="h-8 py-1.5 text-xs flex items-center gap-1 font-bold border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          >
            <Download size={13} />
            导出
          </Button>
        </div>

        {/* 流水表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-48">库存流水号</th>
                <th className="p-3 w-44">发生时间</th>
                <th className="p-3 w-36">仓库</th>
                <th className="p-3 w-32">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-36">规格型号</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 w-32 text-center">变动类型</th>
                <th className="p-3 text-right w-24">变动数量</th>
                <th className="p-3 text-right w-28">变动后现存量</th>
                <th className="p-3 w-44">来源单号</th>
                <th className="p-3 w-28">操作人</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedFlows.length > 0 ? (
                paginatedFlows.map(rec => {
                  const isPositive = rec.quantity > 0;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-500">{rec.id}</td>
                      <td className="p-3 text-slate-400 font-medium">{rec.createdAt}</td>
                      <td className="p-3 truncate max-w-[120px]" title={rec.warehouseName}>
                        {rec.warehouseName}
                      </td>
                      <td className="p-3 font-semibold text-slate-500">{rec.productCode}</td>
                      <td className="p-3 font-semibold text-slate-800 truncate max-w-[180px]" title={rec.productName}>
                        {rec.productName}
                      </td>
                      <td className="p-3 text-slate-500 truncate max-w-[110px]" title={rec.productSpec || '-'}>
                        {rec.productSpec || '-'}
                      </td>
                      <td className="p-3 text-slate-400">{rec.unit}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPositive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {getChangeTypeLabel(rec.changeType)}
                        </span>
                      </td>
                      {/* 数量显色：正数+绿色、负数-黑色 */}
                      <td className={`p-3 text-right font-extrabold ${
                        isPositive ? 'text-emerald-600' : 'text-slate-850'
                      }`}>
                        {isPositive ? `+${rec.quantity}` : rec.quantity}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {rec.postQuantity}
                      </td>
                      {/* 来源单号链接点击 */}
                      <td className="p-3">
                        <span
                          onClick={() => handleSourceLinkClick(rec.sourceId)}
                          className="font-medium text-emerald-600 hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          {rec.sourceId}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{rec.operator}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-medium bg-white">
                    没有符合条件的库存流水记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500 bg-slate-50/50">
          <span>共 {flows.length} 条流水，当前第 {currentPage} / {totalPages} 页</span>
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
    </div>
  );
}
