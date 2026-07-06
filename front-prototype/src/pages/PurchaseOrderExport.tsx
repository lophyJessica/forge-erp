import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, Check, RefreshCw } from 'lucide-react';

export default function PurchaseOrderExport() {
  const navigate = useNavigate();
  const location = useLocation();

  // 获取从列表页传过来的选中单号
  const selectedIds = (location.state as any)?.ids || [];

  // --- 状态定义 ---
  const [exportRange, setExportRange] = useState<'SELECTED' | 'ALL'>(selectedIds.length > 0 ? 'SELECTED' : 'ALL');
  const [exportFormat, setExportFormat] = useState<'XLSX' | 'CSV'>('XLSX');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);

  // 导出字段分类配置
  const [fields, setFields] = useState({
    header: [
      { id: 'id', label: '采购单号', checked: true },
      { id: 'supplier', label: '供应商', checked: true },
      { id: 'warehouse', label: '入库仓库', checked: true },
      { id: 'orderDate', label: '下单日期', checked: true },
      { id: 'expectedDate', label: '预计到货日期', checked: true },
      { id: 'status', label: '单据状态', checked: true },
      { id: 'remark', label: '采购备注', checked: true },
    ],
    items: [
      { id: 'prodCode', label: '商品编码', checked: true },
      { id: 'prodName', label: '商品名称', checked: true },
      { id: 'prodBarcode', label: '商品条码', checked: true },
      { id: 'prodSpec', label: '规格型号', checked: true },
      { id: 'prodUnit', label: '单位', checked: true },
      { id: 'quantity', label: '采购数量', checked: true },
      { id: 'price', label: '含税单价', checked: true },
      { id: 'taxRate', label: '税率', checked: true },
      { id: 'amount', label: '本行含税金额', checked: true },
      { id: 'itemRemark', label: '行备注', checked: true },
    ],
    system: [
      { id: 'createdBy', label: '创建人', checked: false },
      { id: 'createdAt', label: '创建时间', checked: false },
      { id: 'updatedBy', label: '修改人', checked: false },
      { id: 'updatedAt', label: '修改时间', checked: false },
      { id: 'approvedBy', label: '审核人', checked: false },
      { id: 'approvedAt', label: '审核时间', checked: false },
    ]
  });

  // --- 全选 / 取消全选逻辑 ---
  const handleToggleCategory = (category: keyof typeof fields, checked: boolean) => {
    setFields(prev => ({
      ...prev,
      [category]: prev[category].map(f => ({ ...f, checked }))
    }));
  };

  const handleToggleField = (category: keyof typeof fields, id: string) => {
    setFields(prev => ({
      ...prev,
      [category]: prev[category].map(f => f.id === id ? { ...f, checked: !f.checked } : f)
    }));
  };

  // --- 导出逻辑模拟 ---
  const handleStartExport = () => {
    // 检查字段是否有选
    const allFields = [...fields.header, ...fields.items, ...fields.system];
    const checkedCount = allFields.filter(f => f.checked).length;
    if (checkedCount === 0) {
      alert('请至少选择一个导出字段');
      return;
    }

    setExporting(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setExporting(false);
          setExportSuccess(true);
          // 模拟自动触发浏览器文件下载
          simulateDownloadTrigger();
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  const simulateDownloadTrigger = () => {
    const filename = `qs_purchase_orders_export_${new Date().toISOString().split('T')[0]}.${exportFormat.toLowerCase()}`;
    console.log(`[原型模拟] 浏览器自动触发下载文件: ${filename}`);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 页头 */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <button onClick={() => navigate('/purchase/orders')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">导出采购订单</h1>
          <p className="text-xs text-slate-500 mt-0.5">将系统内的采购订单按需导出为本地 Excel 或 CSV 数据报表。</p>
        </div>
      </div>

      {exportSuccess ? (
        // 导出成功提示
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8 max-w-md mx-auto text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Check size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">采购订单导出成功</h3>
            <p className="text-xs text-slate-500 mt-2">已完成数据提取并生成导出文件。</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold text-primary">提示：浏览器已自动触发文件下载。</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button size="sm" onClick={() => navigate('/purchase/orders')} className="font-semibold text-xs h-9">
              返回订单列表
            </Button>
          </div>
        </div>
      ) : exporting ? (
        // 导出中进度条
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8 max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <RefreshCw className="text-primary animate-spin" size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800">正在生成导出报表...</h3>
            <p className="text-[10px] text-slate-500">正在检索单据数据、组装商品明细行并计算金额合计，请稍候。</p>
          </div>
          
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-150 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs font-bold text-slate-700">{progress}%</div>
          </div>
        </div>
      ) : (
        // 导出设置页
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左侧范围与格式配置 */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-5 text-xs text-slate-600">
              <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">导出设置</h3>
              
              {/* 导出范围 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500">导出范围</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input 
                      type="radio" 
                      name="exportRange" 
                      value="ALL" 
                      checked={exportRange === 'ALL'}
                      onChange={() => setExportRange('ALL')}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>全部订单数据</span>
                  </label>
                  
                  <label className={`flex items-center gap-2 cursor-pointer font-semibold ${selectedIds.length === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                    <input 
                      type="radio" 
                      name="exportRange" 
                      value="SELECTED"
                      checked={exportRange === 'SELECTED'}
                      onChange={() => setExportRange('SELECTED')}
                      disabled={selectedIds.length === 0}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>列表勾选的订单 ({selectedIds.length} 张)</span>
                  </label>
                </div>
              </div>

              {/* 导出格式 */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500">导出格式</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="XLSX" 
                      checked={exportFormat === 'XLSX'}
                      onChange={() => setExportFormat('XLSX')}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Excel (.xlsx)</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="CSV" 
                      checked={exportFormat === 'CSV'}
                      onChange={() => setExportFormat('CSV')}
                      className="text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>CSV (.csv)</span>
                  </label>
                </div>
              </div>

              {/* 动作按钮 */}
              <div className="pt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/purchase/orders')}
                  className="flex-1 font-semibold"
                >
                  取消
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleStartExport}
                  className="flex-1 font-bold flex items-center justify-center gap-1"
                >
                  <Download size={14} />
                  立即导出
                </Button>
              </div>
            </div>
          </div>

          {/* 右侧字段勾选配置 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-6 text-xs">
              <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">
                配置导出字段
              </h3>

              {/* 类别 1: 单据头部字段 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-150">
                  <span className="font-bold text-slate-700">单据级字段 (表头)</span>
                  <div className="space-x-3 text-[11px] text-primary font-semibold">
                    <button onClick={() => handleToggleCategory('header', true)} className="hover:underline cursor-pointer">全选</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleToggleCategory('header', false)} className="hover:underline cursor-pointer">全不选</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                  {fields.header.map(f => (
                    <label key={f.id} className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input 
                        type="checkbox" 
                        checked={f.checked}
                        onChange={() => handleToggleField('header', f.id)}
                        className="rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 类别 2: 商品明细字段 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-150">
                  <span className="font-bold text-slate-700">商品行字段 (明细)</span>
                  <div className="space-x-3 text-[11px] text-primary font-semibold">
                    <button onClick={() => handleToggleCategory('items', true)} className="hover:underline cursor-pointer">全选</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleToggleCategory('items', false)} className="hover:underline cursor-pointer">全不选</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                  {fields.items.map(f => (
                    <label key={f.id} className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input 
                        type="checkbox" 
                        checked={f.checked}
                        onChange={() => handleToggleField('items', f.id)}
                        className="rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 类别 3: 系统与审计字段 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-150">
                  <span className="font-bold text-slate-700">系统与审计字段</span>
                  <div className="space-x-3 text-[11px] text-primary font-semibold">
                    <button onClick={() => handleToggleCategory('system', true)} className="hover:underline cursor-pointer">全选</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => handleToggleCategory('system', false)} className="hover:underline cursor-pointer">全不选</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                  {fields.system.map(f => (
                    <label key={f.id} className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input 
                        type="checkbox" 
                        checked={f.checked}
                        onChange={() => handleToggleField('system', f.id)}
                        className="rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
