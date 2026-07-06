import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Upload, FileSpreadsheet, Check, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { 
  MOCK_SUPPLIERS, 
  MOCK_WAREHOUSES, 
  MOCK_PRODUCTS,
  purchaseOrderApi
} from '../api/purchaseOrder';
import { PurchaseOrder, PurchaseOrderItem } from '../types/purchaseOrder';

interface ImportRow {
  index: number;
  poNumber: string;
  supplierCode: string;
  warehouseCode: string;
  orderDate: string;
  productCode: string;
  quantity: number;
  price: number;
  taxRate: string;
  remark: string;
  errors: string[];
}

export default function PurchaseOrderImport() {
  const navigate = useNavigate();
  
  // --- 状态定义 ---
  const [dragActive, setDragActive] = useState(false);
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [isMappingActive, setIsMappingActive] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  // 映射选择（模拟列名映射）
  const [columnMapping, setColumnMapping] = useState({
    poNumber: '采购单号',
    supplierCode: '供应商编码',
    warehouseCode: '仓库编码',
    orderDate: '下单日期',
    productCode: '商品编码',
    quantity: '数量',
    price: '含税单价',
  });

  // --- 模拟文件模板数据 ---
  const TEMPLATE_CORRECT: ImportRow[] = [
    {
      index: 1,
      poNumber: 'PO20260704-8001',
      supplierCode: 'SUP001',
      warehouseCode: 'WH001',
      orderDate: '2026-07-04',
      productCode: 'SKU001',
      quantity: 50,
      price: 2.5,
      taxRate: '13%',
      remark: '导入测试行1',
      errors: []
    },
    {
      index: 2,
      poNumber: 'PO20260704-8001',
      supplierCode: 'SUP001',
      warehouseCode: 'WH001',
      orderDate: '2026-07-04',
      productCode: 'SKU003',
      quantity: 20,
      price: 16.5,
      taxRate: '13%',
      remark: '导入测试行2',
      errors: []
    },
    {
      index: 3,
      poNumber: 'PO20260704-8002',
      supplierCode: 'SUP003',
      warehouseCode: 'WH003',
      orderDate: '2026-07-04',
      productCode: 'SKU002',
      quantity: 100,
      price: 1.8,
      taxRate: '3%',
      remark: '导入测试行3',
      errors: []
    }
  ];

  const TEMPLATE_WITH_ERRORS: ImportRow[] = [
    {
      index: 1,
      poNumber: 'PO20260704-9001',
      supplierCode: 'SUP999', // 错误：供应商不存在
      warehouseCode: 'WH001',
      orderDate: '2026-07-04',
      productCode: 'SKU001',
      quantity: 50,
      price: 2.5,
      taxRate: '13%',
      remark: '问题数据1',
      errors: ['[供应商 SUP999 不存在于供应商档案]']
    },
    {
      index: 2,
      poNumber: 'PO20260704-9001',
      supplierCode: 'SUP999',
      warehouseCode: 'WH999', // 错误：仓库不存在
      orderDate: '2026-07-04',
      productCode: 'SKU999', // 错误：商品编码不存在
      quantity: 0, // 错误：数量必须大于 0
      price: -5.0, // 错误：价格不能为负
      taxRate: '13%',
      remark: '问题数据2',
      errors: [
        '[仓库 WH999 不存在]',
        '[商品 SKU999 无效]',
        '[采购数量必须大于 0]',
        '[单价必须大于等于 0]'
      ]
    },
    {
      index: 3,
      poNumber: 'PO20260704-9002',
      supplierCode: 'SUP002',
      warehouseCode: 'WH002',
      orderDate: '2026-07-04',
      productCode: 'SKU006',
      quantity: 10,
      price: 45.0,
      taxRate: '13%',
      remark: '正确行数据',
      errors: []
    }
  ];

  // --- 交互事件 ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      simulateUpload(file.name, true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      simulateUpload(file.name, true);
    }
  };

  const simulateUpload = (fileName: string, isCorrectTemplate: boolean) => {
    setFileUploaded(fileName);
    setIsMappingActive(true);
    setParsedRows(isCorrectTemplate ? TEMPLATE_CORRECT : TEMPLATE_WITH_ERRORS);
  };

  // 确认导入
  const handleConfirmImport = () => {
    const errorCount = parsedRows.reduce((sum, r) => sum + r.errors.length, 0);
    if (errorCount > 0) {
      alert('存在校验失败的数据，无法执行导入。请修改文件后重新上传，或选择无错误的模板进行演示。');
      return;
    }

    try {
      // 聚合行到采购订单实体
      const ordersToImport: Record<string, Omit<PurchaseOrder, 'itemCount' | 'totalQuantity' | 'totalAmount'>> = {};

      parsedRows.forEach(row => {
        const supplier = MOCK_SUPPLIERS.find(s => s.code === row.supplierCode)!;
        const warehouse = MOCK_WAREHOUSES.find(w => w.code === row.warehouseCode)!;
        const product = MOCK_PRODUCTS.find(p => p.code === row.productCode)!;

        const newOrderItem: PurchaseOrderItem = {
          id: `row-${Date.now()}-${row.index}`,
          productCode: row.productCode,
          productName: product.name,
          productBarcode: product.barcode,
          productSpec: product.spec,
          unit: product.unit,
          quantity: row.quantity,
          price: row.price,
          taxRate: row.taxRate as any,
          amount: parseFloat((row.quantity * row.price).toFixed(2)),
          receivedQuantity: 0,
          pendingQuantity: row.quantity,
          remark: row.remark
        };

        if (!ordersToImport[row.poNumber]) {
          ordersToImport[row.poNumber] = {
            id: row.poNumber,
            supplierCode: row.supplierCode,
            supplierName: supplier.name,
            warehouseCode: row.warehouseCode,
            warehouseName: warehouse.name,
            orderDate: row.orderDate,
            expectedDeliveryDate: undefined,
            status: 'DRAFT', // 导入的默认是草稿状态
            remark: '批量数据导入',
            createdBy: 'System',
            createdAt: '2026-07-04 12:00:00',
            items: []
          };
        }

        ordersToImport[row.poNumber].items.push(newOrderItem);
      });

      // 补充汇总字段并调用 API 导入
      const finalOrders: PurchaseOrder[] = Object.values(ordersToImport).map(o => {
        const itemCount = o.items.length;
        const totalQuantity = o.items.reduce((sum, it) => sum + it.quantity, 0);
        const totalAmount = parseFloat(o.items.reduce((sum, it) => sum + it.amount, 0).toFixed(2));
        return {
          ...o,
          itemCount,
          totalQuantity,
          totalAmount
        } as PurchaseOrder;
      });

      purchaseOrderApi.importOrders(finalOrders);
      setImportResult({ success: finalOrders.length, failed: 0 });
    } catch (err: any) {
      alert(err.message || '导入出错');
    }
  };

  const hasErrors = parsedRows.some(row => row.errors.length > 0);

  return (
    <div className="space-y-4 pb-12">
      {/* 页头 */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <button onClick={() => navigate('/purchase/orders')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">导入采购订单</h1>
          <p className="text-xs text-slate-500 mt-0.5">从外部文件（.xlsx / .csv）批量生成采购订单草稿数据。</p>
        </div>
      </div>

      {importResult ? (
        // 导入成功展示页
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8 max-w-md mx-auto text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">批量数据导入成功</h3>
            <p className="text-xs text-slate-500 mt-2">已成功解析并导入 <span className="text-emerald-600 font-bold">{importResult.success}</span> 张采购订单。</p>
            <p className="text-[10px] text-slate-400 mt-0.5">单据全部以“草稿”状态存入系统，可在列表页中进行提审。</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button size="sm" onClick={() => navigate('/purchase/orders')} className="font-semibold text-xs h-9">
              返回订单列表
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 上传组件（左侧/上方） */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700">演示模板选择</h3>
              <p className="text-[10px] text-slate-500">为了方便在原型环境中进行演示，您可以直接选用下方预置好的数据模版进行导入：</p>
              
              <div className="flex flex-col gap-2 pt-1 text-xs">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => simulateUpload('QS_Purchase_Template_Correct.xlsx', true)}
                  className="w-full text-[11px] h-8 justify-start font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-200"
                >
                  <FileText size={14} className="mr-1 text-slate-400" />
                  加载正确模版（可导入）
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => simulateUpload('QS_Purchase_Template_Error.xlsx', false)}
                  className="w-full text-[11px] h-8 justify-start font-semibold text-slate-700 hover:text-rose-700 hover:border-rose-200"
                >
                  <FileText size={14} className="mr-1 text-slate-400" />
                  加载含错误模版（触发校验）
                </Button>
              </div>
            </div>

            {/* 上传框 */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`bg-white p-6 rounded-lg shadow-sm border-2 border-dashed rounded-lg p-6 flex flex-col items-center text-center justify-center min-h-[220px] transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Upload className="text-slate-400 mb-2" size={32} />
              <div className="text-xs font-bold text-slate-700">拖拽文件到这里</div>
              <div className="text-[10px] text-slate-400 mt-1">支持 Excel (.xlsx) 或 CSV (.csv)</div>
              
              <div className="mt-4">
                <label className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 py-1.5 rounded font-semibold shadow cursor-pointer">
                  选择本地文件
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept=".xlsx,.csv" 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {fileUploaded && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
                <FileSpreadsheet className="text-emerald-500" size={24} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{fileUploaded}</p>
                  <p className="text-[10px] text-slate-400">已载入并解析成功</p>
                </div>
              </div>
            )}
          </div>

          {/* 解析与映射卡片（右侧/下方） */}
          <div className="lg:col-span-3 space-y-4">
            {isMappingActive && (
              <>
                {/* 字段映射配置 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 text-xs">
                  <h3 className="text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
                    字段映射与列对齐
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(columnMapping).map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
                        <select className="w-full h-8 border border-slate-200 rounded px-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none">
                          <option value={key}>{label}</option>
                          <option value="none">暂不对应</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 预览数据表格 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700">解析数据预览</h3>
                    <div className="flex items-center gap-3 text-xs">
                      {hasErrors ? (
                        <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          <AlertTriangle size={13} />
                          包含校验失败行 (无法提交)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          <Check size={13} />
                          数据验证全部通过
                        </span>
                      )}
                      <span className="text-slate-500">共 {parsedRows.length} 条记录</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                          <th className="p-3 w-12 text-center">行号</th>
                          <th className="p-3">拟定单号</th>
                          <th className="p-3">供应商编码</th>
                          <th className="p-3">仓库编码</th>
                          <th className="p-3">下单日期</th>
                          <th className="p-3">商品编码</th>
                          <th className="p-3 text-right">数量</th>
                          <th className="p-3 text-right">含税单价</th>
                          <th className="p-3">税率</th>
                          <th className="p-3">备注</th>
                          <th className="p-3">状态 / 错误日志</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {parsedRows.map((row, idx) => {
                          const isInvalid = row.errors.length > 0;
                          return (
                            <tr key={idx} className={`hover:bg-slate-50/20 ${isInvalid ? 'bg-rose-50/40 hover:bg-rose-50/40' : ''}`}>
                              <td className="p-3 text-center text-slate-400">{row.index}</td>
                              <td className="p-3 font-semibold">{row.poNumber}</td>
                              <td className={`p-3 font-semibold ${isInvalid && row.errors.some(e => e.includes('供应商')) ? 'text-rose-600' : ''}`}>{row.supplierCode}</td>
                              <td className={`p-3 font-semibold ${isInvalid && row.errors.some(e => e.includes('仓库')) ? 'text-rose-600' : ''}`}>{row.warehouseCode}</td>
                              <td className="p-3">{row.orderDate}</td>
                              <td className={`p-3 font-semibold ${isInvalid && row.errors.some(e => e.includes('商品')) ? 'text-rose-600' : ''}`}>{row.productCode}</td>
                              <td className={`p-3 text-right font-semibold ${isInvalid && row.errors.some(e => e.includes('数量')) ? 'text-rose-600' : ''}`}>{row.quantity}</td>
                              <td className={`p-3 text-right font-semibold ${isInvalid && row.errors.some(e => e.includes('单价')) ? 'text-rose-600' : ''}`}>¥{row.price}</td>
                              <td className="p-3">{row.taxRate}</td>
                              <td className="p-3 text-slate-500 max-w-[100px] truncate">{row.remark}</td>
                              <td className="p-3">
                                {isInvalid ? (
                                  <div className="text-rose-600 space-y-0.5 leading-snug">
                                    {row.errors.map((err, i) => <p key={i} className="text-[10px]">{err}</p>)}
                                  </div>
                                ) : (
                                  <span className="text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.2">
                                    校验正常
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 导入操作底部 */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      提示：数据导入系统后作为“草稿”状态，需要手动从采购订单列表提审。
                    </span>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsMappingActive(false)}>
                        取消
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleConfirmImport} 
                        disabled={hasErrors}
                        className="font-bold text-xs"
                      >
                        确认导入并生成草稿
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
