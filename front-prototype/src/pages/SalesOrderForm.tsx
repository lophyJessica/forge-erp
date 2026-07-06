import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Search, X, AlertCircle } from 'lucide-react';
import { salesApi, getWholesalePrice, type SalesProduct } from '../api/sales';
import type { BaseCustomer } from '../types/baseData';
import type { SalesOrderItem } from '../types/sales';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

type EditableItem = Omit<SalesOrderItem, 'outboundQuantity' | 'pendingOutboundQuantity'>;

function SelectWithSearch({
  customers,
  value,
  disabled,
  onChange,
  error
}: {
  customers: BaseCustomer[];
  value: string;
  disabled?: boolean;
  onChange: (code: string) => void;
  error?: string;
}) {
  const [keyword, setKeyword] = useState('');
  const selected = customers.find(c => c.code === value);
  const filtered = customers.filter(c => `${c.code}${c.name}${c.contact}`.toLowerCase().includes(keyword.toLowerCase()));

  if (disabled) {
    return (
      <div className="h-10 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-slate-600 font-semibold">
        {selected ? `${selected.code} ${selected.name} · ${selected.priceLevel}` : '-'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索客户编码/名称/联系人" className={`h-10 text-xs pl-8 ${error ? 'border-rose-400' : ''}`} />
      </div>
      <div className="max-h-32 overflow-auto border border-slate-100 rounded-md divide-y divide-slate-100 bg-white">
        {filtered.map(customer => (
          <button
            key={customer.code}
            type="button"
            onClick={() => {
              onChange(customer.code);
              setKeyword('');
            }}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 ${value === customer.code ? 'bg-primary/5 text-primary font-bold' : 'text-slate-600'}`}
          >
            <span className="font-mono">{customer.code}</span>
            <span className="ml-2 font-semibold">{customer.name}</span>
            <span className="ml-2 text-[10px] text-slate-400">{customer.priceLevel}批发价</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const customers = salesApi.getCustomers();
  const products = salesApi.getProducts();

  const [customerCode, setCustomerCode] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [locked, setLocked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SalesProduct[]>([]);

  useEffect(() => {
    if (!isEditMode || !id) return;
    const order = salesApi.getSalesOrderById(id);
    if (!order) {
      alert('销售订单不存在');
      navigate('/sales/orders');
      return;
    }
    setCustomerCode(order.customerCode);
    setOrderDate(order.orderDate);
    setRemark(order.remark || '');
    setLocked(order.status !== 'DRAFT');
    setItems(order.items.map(item => ({
      id: item.id,
      productCode: item.productCode,
      productName: item.productName,
      productBarcode: item.productBarcode,
      productSpec: item.productSpec,
      unit: item.unit,
      quantity: item.quantity,
      price: item.price,
      priceLevel: item.priceLevel,
      amount: item.amount,
      remark: item.remark
    })));
  }, [id, isEditMode, navigate]);

  const selectedCustomer = customers.find(c => c.code === customerCode);
  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const filteredProducts = useMemo(() => products.filter(product =>
    `${product.code}${product.name}${product.barcode}`.toLowerCase().includes(productSearch.toLowerCase())
  ), [products, productSearch]);

  const handleCustomerChange = (code: string) => {
    setCustomerCode(code);
    const customer = customers.find(c => c.code === code);
    if (!customer) return;
    setItems(prev => prev.map(item => {
      const product = products.find(p => p.code === item.productCode);
      const price = product ? getWholesalePrice(product, customer.priceLevel) : item.price;
      return {
        ...item,
        priceLevel: customer.priceLevel,
        price,
        amount: parseFloat((item.quantity * price).toFixed(2))
      };
    }));
  };

  const handleItemChange = (itemId: string, field: keyof EditableItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const next = { ...item, [field]: value } as EditableItem;
      if (field === 'quantity' || field === 'price') {
        next.amount = parseFloat((Number(next.quantity) * Number(next.price)).toFixed(2));
      }
      return next;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const toggleProduct = (product: SalesProduct) => {
    setSelectedProducts(prev => prev.some(p => p.code === product.code)
      ? prev.filter(p => p.code !== product.code)
      : [...prev, product]);
  };

  const confirmProducts = () => {
    if (!selectedCustomer) {
      alert('请先选择客户，系统会按客户等级带出批发价');
      return;
    }
    const newItems = selectedProducts
      .filter(product => !items.some(item => item.productCode === product.code))
      .map((product, index) => {
        const price = getWholesalePrice(product, selectedCustomer.priceLevel);
        return {
          id: `new-${Date.now()}-${index}`,
          productCode: product.code,
          productName: product.name,
          productBarcode: product.barcode,
          productSpec: product.spec,
          unit: product.unit,
          quantity: 1,
          price,
          priceLevel: selectedCustomer.priceLevel,
          amount: price,
          remark: ''
        };
      });
    setItems(prev => [...prev, ...newItems]);
    setSelectedProducts([]);
    setProductSearch('');
    setIsProductModalOpen(false);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!customerCode) next.customerCode = '请选择客户';
    if (!orderDate) next.orderDate = '请选择下单日期';
    if (orderDate > new Date().toISOString().split('T')[0]) next.orderDate = '下单日期不能晚于今天';
    if (items.length === 0) next.items = '至少添加一行商品明细';
    items.forEach(item => {
      if (item.quantity <= 0) next[`qty-${item.id}`] = '销售数量必须大于 0';
      if (item.price < 0) next[`price-${item.id}`] = '单价不能小于 0';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = (submit: boolean) => {
    if (!validate()) {
      alert('表单校验未通过，请检查红字提示字段');
      return;
    }
    try {
      const payload = { customerCode, orderDate, remark, items };
      const order = isEditMode && id ? salesApi.updateSalesOrder(id, payload as any) : salesApi.createSalesOrder(payload);
      if (submit) salesApi.submitSalesOrder(order.id);
      alert(submit ? '销售订单已保存并提交审核' : '销售订单草稿已保存');
      navigate('/sales/orders');
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <button type="button" onClick={() => navigate('/sales/orders')} className="p-1 hover:bg-slate-100 rounded">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{isEditMode ? `编辑销售订单 ${id}` : '新建销售订单'}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{locked ? '订单已审核或已出库，关键字段与商品明细已锁定' : '售出价会按客户等级批发价带出并保存为订单价格快照。'}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1 md:col-span-1">
            <label className="block text-slate-500 font-semibold">客户 <span className="text-rose-500">*</span></label>
            <SelectWithSearch customers={customers} value={customerCode} onChange={handleCustomerChange} disabled={locked} error={errors.customerCode} />
            {errors.customerCode && <span className="text-rose-500 text-[10px]">{errors.customerCode}</span>}
          </div>
          <div className="space-y-1">
            <label className="block text-slate-500 font-semibold">下单日期 <span className="text-rose-500">*</span></label>
            {locked ? (
              <div className="h-10 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-slate-600">{orderDate}</div>
            ) : (
              <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className={errors.orderDate ? 'border-rose-400' : ''} />
            )}
            {errors.orderDate && <span className="text-rose-500 text-[10px]">{errors.orderDate}</span>}
          </div>
          <div className="space-y-1">
            <label className="block text-slate-500 font-semibold">价格等级</label>
            <div className="h-10 bg-slate-50 border border-slate-100 rounded-md flex items-center px-3 text-slate-600 font-semibold">
              {selectedCustomer ? `${selectedCustomer.priceLevel}批发价` : '选择客户后自动带出'}
            </div>
          </div>
          <div className="md:col-span-3 space-y-1">
            <label className="block text-slate-500 font-semibold">备注</label>
            <Textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} className="text-xs" placeholder="请输入销售备注" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">商品明细</h3>
          {!locked && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsProductModalOpen(true)} className="gap-1 font-semibold">
              <Plus size={14} />
              选择商品
            </Button>
          )}
        </div>
        {errors.items && <div className="flex items-center gap-1.5 p-3 rounded-md bg-rose-50 border border-rose-100 text-xs text-rose-600"><AlertCircle size={15} />{errors.items}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 w-28 text-right">销售数量</th>
                <th className="p-3 w-32 text-right">售出价快照</th>
                <th className="p-3 w-32 text-right">金额</th>
                <th className="p-3">行备注</th>
                {!locked && <th className="p-3 w-16 text-center">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/30">
                  <td className="p-3 text-center text-slate-400">{index + 1}</td>
                  <td className="p-3 font-semibold text-slate-700">{item.productCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productSpec}</td>
                  <td className="p-3 text-slate-500">{item.unit}</td>
                  <td className="p-3">
                    {locked ? <div className="text-right font-bold">{item.quantity}</div> : (
                      <>
                        <Input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value ? parseInt(e.target.value, 10) : 0)} className="h-8 text-xs text-right" />
                        {errors[`qty-${item.id}`] && <span className="block text-right text-[10px] text-rose-500">{errors[`qty-${item.id}`]}</span>}
                      </>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-700">¥{item.price.toFixed(2)}<div className="text-[10px] text-slate-400">{item.priceLevel}</div></td>
                  <td className="p-3 text-right font-extrabold text-slate-800">¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3"><Input value={item.remark || ''} onChange={e => handleItemChange(item.id, 'remark', e.target.value)} className="h-8 text-xs" /></td>
                  {!locked && <td className="p-3 text-center"><button type="button" onClick={() => removeItem(item.id)} className="text-rose-600 font-semibold hover:underline">删除</button></td>}
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={locked ? 9 : 10} className="p-8 text-center text-slate-400">暂无商品明细</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md text-xs font-bold text-slate-700 border border-slate-100">
          <div>共 <span className="text-primary">{itemCount}</span> 种商品</div>
          <div className="flex gap-8">
            <span>总数量：<span className="text-primary">{totalQuantity}</span></span>
            <span>总金额：<span className="text-primary text-sm">¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 px-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-40 flex justify-between items-center">
        <button type="button" onClick={() => navigate('/sales/orders')} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">返回列表</button>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => save(false)} className="h-9 px-4 text-xs font-semibold">保存草稿</Button>
          {!locked && <Button size="sm" onClick={() => save(true)} className="h-9 px-5 text-xs font-bold">保存并提交审核</Button>}
        </div>
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-3xl w-full p-6 space-y-4 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">选择销售商品</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">按客户等级带出批发价，并保存为本单售出价快照。</p>
              </div>
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><X size={18} /></button>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="按商品编码、名称、条码搜索" className="h-9 text-xs pl-9" />
            </div>
            <div className="overflow-y-auto flex-1 min-h-[260px] border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold sticky top-0">
                    <th className="p-3 w-12 text-center">选择</th>
                    <th className="p-3 w-28">编码</th>
                    <th className="p-3">商品名称</th>
                    <th className="p-3 w-28">规格</th>
                    <th className="p-3 w-24 text-right">批发价</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredProducts.map(product => {
                    const checked = selectedProducts.some(p => p.code === product.code);
                    const exists = items.some(item => item.productCode === product.code);
                    const price = selectedCustomer ? getWholesalePrice(product, selectedCustomer.priceLevel) : product.wholesalePrice3;
                    return (
                      <tr key={product.code} onClick={() => !exists && toggleProduct(product)} className={`${exists ? 'bg-slate-50 text-slate-400' : 'hover:bg-slate-50 cursor-pointer'} ${checked ? 'bg-primary/5' : ''}`}>
                        <td className="p-3 text-center"><input type="checkbox" checked={checked || exists} disabled={exists} onChange={() => toggleProduct(product)} /></td>
                        <td className="p-3 font-mono font-semibold">{product.code}</td>
                        <td className="p-3 font-semibold">{product.name}{exists && <span className="ml-2 text-[10px] text-slate-400">已添加</span>}</td>
                        <td className="p-3 text-slate-500">{product.spec}</td>
                        <td className="p-3 text-right font-bold">¥{price.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">已选 <span className="font-bold text-primary">{selectedProducts.length}</span> 项</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(false)}>取消</Button>
                <Button size="sm" onClick={confirmProducts} className="font-semibold">确认添加</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
