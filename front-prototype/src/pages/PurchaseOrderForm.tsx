import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  TaxRate,
  Product
} from '../types/purchaseOrder';
import { 
  purchaseOrderApi, 
  MOCK_SUPPLIERS, 
  MOCK_WAREHOUSES,
  MOCK_PRODUCTS
} from '../api/purchaseOrder';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Search, X, Plus, AlertCircle, ArrowLeft } from 'lucide-react';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // --- 表单状态 ---
  const [supplierCode, setSupplierCode] = useState('');
  const [warehouseCode, setWarehouseCode] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<Omit<PurchaseOrderItem, 'receivedQuantity' | 'pendingQuantity'>[]>([]);
  const [orderStatus, setOrderStatus] = useState<'DRAFT' | 'LOCKED'>('DRAFT');

  // 商品选择弹窗状态
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [tempSelectedProducts, setTempSelectedProducts] = useState<Product[]>([]);

  // 校验错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 数量输入框的 Ref，用于定位焦点
  const qtyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // --- 初始化数据（编辑模式） ---
  useEffect(() => {
    if (isEditMode && id) {
      const order = purchaseOrderApi.getOrderById(id);
      if (order) {
        setSupplierCode(order.supplierCode);
        setWarehouseCode(order.warehouseCode);
        setOrderDate(order.orderDate);
        setExpectedDeliveryDate(order.expectedDeliveryDate || '');
        setRemark(order.remark || '');
        setItems(order.items.map(it => ({
          id: it.id,
          productCode: it.productCode,
          productName: it.productName,
          productBarcode: it.productBarcode,
          productSpec: it.productSpec,
          unit: it.unit,
          quantity: it.quantity,
          price: it.price,
          taxRate: it.taxRate,
          amount: it.amount,
          remark: it.remark
        })));
        
        // 关键字段锁定的状态判断：非草稿态单据，表单中关键信息锁定只读
        if (order.status !== 'DRAFT') {
          setOrderStatus('LOCKED');
        }
      } else {
        alert('未找到该订单');
        navigate('/purchase/orders');
      }
    }
  }, [isEditMode, id]);

  // --- 汇总计算 ---
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const totalAmount = items.reduce((sum, it) => sum + (it.amount || 0), 0);

  // --- 表单项修改处理 ---
  const handleItemChange = (itemId: string, field: keyof typeof items[0], value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        // 修改数量或价格时，实时计算本行含税金额
        if (field === 'quantity' || field === 'price') {
          const q = field === 'quantity' ? Number(value) : item.quantity;
          const p = field === 'price' ? Number(value) : item.price;
          updated.amount = parseFloat((q * p).toFixed(2));
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    if (items.length <= 1) {
      alert('至少需要保留一行商品明细');
      return;
    }
    setItems(prev => prev.filter(x => x.id !== itemId));
  };

  // --- 商品弹框逻辑 ---
  const handleOpenProductModal = () => {
    if (items.length >= 50) {
      alert('商品明细最多 50 行');
      return;
    }
    setTempSelectedProducts([]);
    setProductSearch('');
    setIsProductModalOpen(true);
  };

  // 商品列表过滤
  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleSelectProduct = (product: Product) => {
    setTempSelectedProducts(prev => {
      const exists = prev.some(p => p.code === product.code);
      if (exists) {
        return prev.filter(p => p.code !== product.code);
      } else {
        if (items.length + prev.length >= 50) {
          alert('采购订单商品种类上限为 50 种');
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  const handleConfirmProducts = () => {
    if (tempSelectedProducts.length === 0) {
      setIsProductModalOpen(false);
      return;
    }

    const newItems = tempSelectedProducts.map((p, idx) => {
      const itemId = `new-${Date.now()}-${idx}`;
      return {
        id: itemId,
        productCode: p.code,
        productName: p.name,
        productBarcode: p.barcode,
        productSpec: p.spec,
        unit: p.unit,
        quantity: 1, // 预填数量 1
        price: p.defaultPurchasePrice, // 预填商品采购默认价
        taxRate: '' as any,
        amount: p.defaultPurchasePrice,
        remark: ''
      };
    });

    setItems(prev => [...prev, ...newItems]);
    setIsProductModalOpen(false);

    // 聚焦到新添加的第一行的数量输入框
    setTimeout(() => {
      const firstNewId = newItems[0]?.id;
      if (firstNewId && qtyInputRefs.current[firstNewId]) {
        qtyInputRefs.current[firstNewId]?.focus();
      }
    }, 100);
  };

  // --- 提交校验与保存 ---
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!supplierCode) newErrors.supplierCode = '请选择供应商';
    if (!warehouseCode) newErrors.warehouseCode = '请选择入库仓库';
    if (!orderDate) newErrors.orderDate = '请选择下单日期';
    
    // 下单日期限制：禁止未来日期
    const today = new Date().toISOString().split('T')[0];
    if (orderDate > today) {
      newErrors.orderDate = '下单日期不能超过今天';
    }

    if (items.length === 0) {
      newErrors.items = '至少包含一行商品明细';
    }

    items.forEach((item, index) => {
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`qty-${item.id}`] = '采购数量必须大于0';
      }
      if (item.price === undefined || item.price < 0) {
        newErrors[`price-${item.id}`] = '采购单价必须不小于0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (submitForAudit: boolean) => {
    if (!validateForm()) {
      // 弹出轻提示
      alert('表单校验未通过，请检查红字提示字段');
      return;
    }

    const supplier = MOCK_SUPPLIERS.find(s => s.code === supplierCode)!;
    const warehouse = MOCK_WAREHOUSES.find(w => w.code === warehouseCode)!;

    const postData = {
      supplierCode,
      supplierName: supplier.name,
      warehouseCode,
      warehouseName: warehouse.name,
      orderDate,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      remark: remark || undefined,
      items: items as any
    };

    try {
      let savedOrder: PurchaseOrder;
      if (isEditMode && id) {
        savedOrder = purchaseOrderApi.updateOrder(id, postData);
      } else {
        savedOrder = purchaseOrderApi.createOrder(postData);
      }

      if (submitForAudit) {
        // 执行提审操作，状态 DRAFT -> PENDING_AUDIT
        purchaseOrderApi.submitOrder(savedOrder.id);
        alert(`单据 ${savedOrder.id} 保存并提交审核成功！`);
      } else {
        alert(`单据 ${savedOrder.id} 保存草稿成功！`);
      }
      
      navigate('/purchase/orders');
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const isFieldsLocked = orderStatus === 'LOCKED';

  return (
    <div className="space-y-4 pb-24">
      {/* 页头 */}
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <button onClick={() => navigate('/purchase/orders')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            {isEditMode ? `编辑采购订单 ${id}` : '新建采购订单'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFieldsLocked ? '订单已被审核，仅允许修改预计到货日期与备注信息' : '创建或编辑一张采购单，保存后进入草稿，提交后进入待审核。'}
          </p>
        </div>
      </div>

      {/* 主表单区：头部信息 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              供应商 <span className="text-rose-500">*</span>
            </label>
            {isFieldsLocked ? (
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-slate-600 font-semibold">
                {supplierCode} {MOCK_SUPPLIERS.find(s => s.code === supplierCode)?.name}
              </div>
            ) : (
              <select
                value={supplierCode}
                onChange={e => setSupplierCode(e.target.value)}
                className={`w-full h-10 border rounded-md px-2 focus:ring-2 focus:ring-primary focus:outline-none ${
                  errors.supplierCode ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">请选择供应商</option>
                {MOCK_SUPPLIERS.map(s => (
                  <option key={s.code} value={s.code}>{s.code} {s.name}</option>
                ))}
              </select>
            )}
            {errors.supplierCode && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.supplierCode}</span>}
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              入库仓库 <span className="text-rose-500">*</span>
            </label>
            {isFieldsLocked ? (
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-slate-600 font-semibold">
                {warehouseCode} {MOCK_WAREHOUSES.find(w => w.code === warehouseCode)?.name}
              </div>
            ) : (
              <select
                value={warehouseCode}
                onChange={e => setWarehouseCode(e.target.value)}
                className={`w-full h-10 border rounded-md px-2 focus:ring-2 focus:ring-primary focus:outline-none ${
                  errors.warehouseCode ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">请选择入库仓库</option>
                {MOCK_WAREHOUSES.map(w => (
                  <option key={w.code} value={w.code}>{w.code} {w.name}</option>
                ))}
              </select>
            )}
            {errors.warehouseCode && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.warehouseCode}</span>}
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              下单日期 <span className="text-rose-500">*</span>
            </label>
            {isFieldsLocked ? (
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-slate-600">
                {orderDate}
              </div>
            ) : (
              <Input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className={errors.orderDate ? 'border-rose-400' : ''}
              />
            )}
            {errors.orderDate && <span className="text-rose-500 text-[10px] mt-0.5 block">{errors.orderDate}</span>}
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">预计到货日期</label>
            <Input
              type="date"
              value={expectedDeliveryDate}
              onChange={e => setExpectedDeliveryDate(e.target.value)}
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-slate-500 font-semibold mb-1">采购备注</label>
            <Textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="请输入采购备注，0-200个字（选填）"
              className="text-xs"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* 明细表格卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">商品明细</h3>
          
          {/* 只有在草稿未锁定状态下才可以添加商品 */}
          {!isFieldsLocked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenProductModal}
              disabled={items.length >= 50}
              className="flex items-center gap-1 text-xs h-8 font-semibold"
            >
              <Plus size={14} />
              选择商品 ({items.length}/50)
            </Button>
          )}
        </div>

        {errors.items && (
          <div className="flex items-center gap-1.5 p-3 rounded-md bg-rose-50 border border-rose-100 text-xs text-rose-600">
            <AlertCircle size={15} />
            <span>{errors.items}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-12 text-center">序号</th>
                <th className="p-3 w-32">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-36">商品条码</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 w-28 text-right">采购数量 <span className="text-rose-500">*</span></th>
                <th className="p-3 w-32 text-right">单价 (含税) <span className="text-rose-500">*</span></th>
                <th className="p-3 w-24">税率</th>
                <th className="p-3 w-32 text-right">金额 (含税)</th>
                <th className="p-3">行备注</th>
                {!isFieldsLocked && <th className="p-3 w-16 text-center">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/20">
                    <td className="p-3 text-center text-slate-400">{index + 1}</td>
                    <td className="p-3 font-semibold text-slate-700">{item.productCode}</td>
                    <td className="p-3 text-slate-700 max-w-[180px] truncate">{item.productName}</td>
                    <td className="p-3 text-slate-500">{item.productBarcode || '-'}</td>
                    <td className="p-3 text-slate-500">{item.productSpec || '-'}</td>
                    <td className="p-3 text-slate-500">{item.unit || '-'}</td>
                    
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      {isFieldsLocked ? (
                        <div className="text-right font-semibold text-slate-700">{item.quantity}</div>
                      ) : (
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="1"
                            ref={el => { qtyInputRefs.current[item.id] = el; }}
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={e => handleItemChange(item.id, 'quantity', e.target.value ? parseInt(e.target.value) : 0)}
                            className="text-right h-8 text-xs font-semibold px-2"
                          />
                          {errors[`qty-${item.id}`] && (
                            <span className="text-rose-500 text-[10px] text-right block">{errors[`qty-${item.id}`]}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      {isFieldsLocked ? (
                        <div className="text-right font-semibold text-slate-700">¥{item.price.toFixed(2)}</div>
                      ) : (
                        <div className="space-y-1">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={e => handleItemChange(item.id, 'price', e.target.value ? parseFloat(e.target.value) : 0)}
                              className="text-right h-8 text-xs font-semibold pl-6 pr-2"
                            />
                          </div>
                          {errors[`price-${item.id}`] && (
                            <span className="text-rose-500 text-[10px] text-right block">{errors[`price-${item.id}`]}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      {isFieldsLocked ? (
                        <div className="text-slate-700">{item.taxRate ? `${item.taxRate}` : '-'}</div>
                      ) : (
                        <select
                          value={item.taxRate}
                          onChange={e => handleItemChange(item.id, 'taxRate', e.target.value as TaxRate)}
                          className="h-8 w-full border border-slate-200 rounded px-1.5 text-xs bg-background focus:outline-none"
                        >
                          <option value="">免税</option>
                          <option value="0%">0%</option>
                          <option value="3%">3%</option>
                          <option value="6%">6%</option>
                          <option value="9%">9%</option>
                          <option value="13%">13%</option>
                        </select>
                      )}
                    </td>

                    <td className="p-3 text-right font-bold text-slate-800">
                      ¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="p-3">
                      <Input
                        type="text"
                        value={item.remark}
                        onChange={e => handleItemChange(item.id, 'remark', e.target.value)}
                        placeholder="行备注"
                        className="h-8 text-xs px-2"
                      />
                    </td>

                    {!isFieldsLocked && (
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                        >
                          删除
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isFieldsLocked ? 11 : 12} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div>暂无商品明细</div>
                      <div className="text-[10px]">请点击右上角“选择商品”添加本次采购物料</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 汇总行 */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md text-xs font-bold text-slate-700 border border-slate-100">
          <div>共 <span className="text-primary">{itemCount}</span> 种商品</div>
          <div className="flex gap-8">
            <div>总数量：<span className="text-primary">{totalQuantity} 件</span></div>
            <div>总金额：<span className="text-primary text-sm font-extrabold">¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      </div>

      {/* 固定底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 py-3 px-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-40 flex justify-between items-center">
        <button
          type="button"
          onClick={() => navigate('/purchase/orders')}
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
        >
          返回列表
        </button>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} className="h-9 px-4 text-xs font-semibold">
            保存草稿
          </Button>
          <Button size="sm" onClick={() => handleSave(true)} className="h-9 px-5 text-xs font-bold">
            保存并提交审核
          </Button>
        </div>
      </div>

      {/* 商品选择多选弹窗 */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-3xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">选择采购商品档案</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">从启用中的商品目录中选择要采购的产品，订单上限 50 行明细。</p>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <Input
                type="text"
                placeholder="按商品编码、名称进行模糊搜索..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* 商品表格 */}
            <div className="overflow-y-auto flex-1 min-h-[250px] border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold sticky top-0 z-10">
                    <th className="p-3 w-10 text-center">选择</th>
                    <th className="p-3 w-28">商品编码</th>
                    <th className="p-3">商品名称</th>
                    <th className="p-3 w-32">商品条码</th>
                    <th className="p-3 w-28">规格型号</th>
                    <th className="p-3 w-16">单位</th>
                    <th className="p-3 w-24 text-right">默认采购价</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => {
                      const isChecked = tempSelectedProducts.some(p => p.code === product.code);
                      const isAlreadyAdded = items.some(it => it.productCode === product.code);
                      
                      return (
                        <tr 
                          key={product.code}
                          onClick={() => {
                            if (isAlreadyAdded) return;
                            toggleSelectProduct(product);
                          }}
                          className={`transition-colors cursor-pointer ${
                            isAlreadyAdded 
                              ? 'bg-slate-50 text-slate-400 pointer-events-none' 
                              : isChecked 
                              ? 'bg-primary/5 hover:bg-primary/5' 
                              : 'hover:bg-slate-50/30'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked || isAlreadyAdded}
                              disabled={isAlreadyAdded}
                              onChange={() => toggleSelectProduct(product)}
                              className="rounded text-primary border-slate-300 focus:ring-primary cursor-pointer disabled:opacity-50"
                            />
                          </td>
                          <td className="p-3 font-semibold">{product.code}</td>
                          <td className="p-3 font-medium">
                            {product.name}
                            {isAlreadyAdded && <span className="ml-2 text-[10px] text-slate-400 bg-slate-150 px-1 py-0.2 rounded">已存在于明细中</span>}
                          </td>
                          <td className="p-3 text-slate-500">{product.barcode || '-'}</td>
                          <td className="p-3 text-slate-500">{product.spec || '-'}</td>
                          <td className="p-3 text-slate-500">{product.unit || '-'}</td>
                          <td className="p-3 text-right font-bold text-slate-700">¥{product.defaultPurchasePrice.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        未搜索到相关商品档案
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 弹窗底部 */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                当前选中 <span className="font-bold text-primary">{tempSelectedProducts.length}</span> 项商品 
                (明细行数: {items.length} / 50)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(false)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleConfirmProducts} className="font-semibold">
                  确认添加
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
