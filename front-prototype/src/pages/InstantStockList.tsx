import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InstantStock } from '../types/stockIn';
import { stockInApi } from '../api/stockIn';
import { MOCK_PRODUCTS, MOCK_WAREHOUSES } from '../api/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, RotateCcw, Download, AlertTriangle } from 'lucide-react';

export default function InstantStockList() {
  const navigate = useNavigate();

  // --- 筛选条件状态 ---
  const [warehouseCode, setWarehouseCode] = useState('');
  const [productCode, setProductCode] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [hideZeroStock, setHideZeroStock] = useState(false);

  // 列表数据
  const [stocks, setStocks] = useState<InstantStock[]>([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // --- 数据加载 ---
  const loadData = () => {
    const res = stockInApi.getInstantStocks({
      warehouseCode,
      productCode,
      batchNo,
      hideZeroStock,
    });
    setStocks(res);
  };

  useEffect(() => {
    loadData();
  }, [warehouseCode, productCode, batchNo, hideZeroStock]);

  // --- 交互处理 ---
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleReset = () => {
    setWarehouseCode('');
    setProductCode('');
    setBatchNo('');
    setHideZeroStock(false);
  };

  const handleExport = () => {
    if (stocks.length === 0) return;
    alert(`成功导出 ${stocks.length} 条即时库存记录数据！`);
  };

  // 分页计算
  const totalPages = Math.ceil(stocks.length / pageSize) || 1;
  const paginatedStocks = stocks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 系统查询生成时间
  const queryTime = new Date().toISOString().replace('T', ' ').split('.')[0];

  return (
    <div className="space-y-4">
      {/* 顶部标题区 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-slate-800">即时库存查询</h1>
          <p className="text-xs text-slate-500 mt-1">
            实时汇总统计各仓商品库存三口径，现存、占用、可用同屏展现
          </p>
        </div>
      </div>

      {/* 复合搜索过滤区 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* 1. 仓库 */}
            <div className="space-y-1 w-48">
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
            <div className="space-y-1 w-64">
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

            {/* 3. 批次号 */}
            <div className="space-y-1 w-44">
              <label className="font-semibold text-slate-500 block">批次号</label>
              <Input
                value={batchNo}
                onChange={e => setBatchNo(e.target.value)}
                placeholder="支持批次号右模糊"
                className="h-9 text-xs"
              />
            </div>

            {/* 4. 不显示零库存开关 */}
            <div className="flex items-center gap-2 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideZeroStock}
                  onChange={e => setHideZeroStock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="font-bold text-slate-600 text-xs">不显示零库存</span>
            </div>

            {/* 搜索控制按钮 */}
            <div className="flex items-end gap-2 ml-auto pt-4">
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
          </div>
        </form>
      </div>

      {/* 数据展现列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        {/* 工具栏 */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold">
            即时库存数据明细
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={stocks.length === 0}
            onClick={handleExport}
            className="h-8 py-1.5 text-xs flex items-center gap-1 font-bold border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          >
            <Download size={13} />
            导出
          </Button>
        </div>

        {/* 表格容器：加 overflow-x-auto 并设定 min-w 大于容器以触发横向滚动和 sticky 固定列 */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold">
                {/* 左固定列 1：商品编码 */}
                <th className="p-3 w-32 sticky left-0 z-20 bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">商品编码</th>
                {/* 左固定列 2：商品名称 */}
                <th className="p-3 w-48 sticky left-[120px] z-20 bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">商品名称</th>
                <th className="p-3 w-32">规格型号</th>
                <th className="p-3 w-20">单位</th>
                <th className="p-3 w-36">仓库</th>
                <th className="p-3 w-36">批次号</th>
                <th className="p-3 text-right w-28 text-slate-600">现存量</th>
                <th className="p-3 text-right w-28 text-slate-600">占用量</th>
                {/* 右固定列 2：可用量 */}
                <th className="p-3 text-right w-28 sticky right-[130px] z-20 bg-slate-50 border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] text-primary">可用量</th>
                <th className="p-3 text-right w-28">安全库存</th>
                <th className="p-3 w-40">最近变动时间</th>
                {/* 右固定列 1：预警标识 */}
                <th className="p-3 text-center w-32 sticky right-0 z-20 bg-slate-50 border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">预警标识</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedStocks.length > 0 ? (
                paginatedStocks.map(rec => {
                  const isNegativeStock = rec.quantity < 0;
                  const isBelowSafety = rec.safetyStock !== '-' && rec.available < rec.safetyStock;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/20 transition-colors">
                      {/* 左固定列 1：商品编码 */}
                      <td className="p-3 font-semibold text-slate-500 sticky left-0 z-10 bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {rec.productCode}
                      </td>
                      {/* 左固定列 2：商品名称 */}
                      <td className="p-3 font-semibold text-slate-800 sticky left-[120px] z-10 bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate max-w-[180px]" title={rec.productName}>
                        {rec.productName}
                      </td>
                      
                      <td className="p-3 text-slate-500 truncate max-w-[120px]" title={rec.productSpec}>
                        {rec.productSpec}
                      </td>
                      <td className="p-3 text-slate-400">{rec.unit}</td>
                      <td className="p-3 truncate max-w-[140px]" title={rec.warehouseName}>
                        {rec.warehouseName}
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-500">
                        {rec.batchNo}
                      </td>

                      {/* 现存量：现存量 < 0 ➔ 红色 */}
                      <td className={`p-3 text-right font-extrabold ${
                        isNegativeStock ? 'text-rose-500' : 'text-slate-800'
                      }`}>
                        {rec.quantity}
                      </td>

                      {/* 占用量 */}
                      <td className="p-3 text-right text-slate-500 font-bold">
                        {rec.occupied}
                      </td>

                      {/* 可用量 (右固定)：可用量 < 安全库存 ➔ 红色加粗 */}
                      <td className={`p-3 text-right sticky right-[130px] z-10 bg-white border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] ${
                        isBelowSafety ? 'text-rose-600 font-black' : 'text-slate-800 font-extrabold'
                      }`}>
                        {rec.available}
                      </td>

                      {/* 安全库存 */}
                      <td className="p-3 text-right text-slate-400 font-bold">
                        {rec.safetyStock}
                      </td>

                      {/* 最近变动时间 */}
                      <td className="p-3 text-slate-400 font-medium">
                        {rec.lastChangedAt}
                      </td>

                      {/* 预警标识 (右固定)：低于安全库存显示黄色 Tag */}
                      <td className="p-3 text-center sticky right-0 z-10 bg-white border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {isBelowSafety ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠️低于安全库存
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-medium bg-white">
                    没有符合条件的即时库存记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控制与会话查询生成时间 */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-500 bg-slate-50/50 gap-2">
          <div className="flex items-center gap-4">
            <span>共 {stocks.length} 条库存记录，当前第 {currentPage} / {totalPages} 页</span>
            <span className="text-slate-400 font-normal">数据生成时间：{queryTime}</span>
          </div>
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
