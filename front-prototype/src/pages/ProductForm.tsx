import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseProduct } from '../types/baseData';
import { baseDataApi } from '../api/baseData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';

export default function ProductForm() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [formData, setFormData] = useState<BaseProduct>({
    code: '',
    name: '',
    barcode: '',
    category: '办公文具',
    spec: '',
    unit: '个',
    defaultPurchasePrice: 0,
    defaultRetailPrice: 0,
    referenceCostPrice: 0,
    status: 'active'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (code) {
      const prod = baseDataApi.getProductByCode(code);
      if (prod) {
        setFormData(JSON.parse(JSON.stringify(prod)));
      } else {
        alert('商品不存在');
        navigate('/base/products');
      }
    }
  }, [code]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) {
      errs.code = '商品编码必填';
    } else if (!code && /[^a-zA-Z0-9_\-]/.test(formData.code)) {
      errs.code = '编码只支持英文字母、数字、下划线和中划线';
    }

    if (!formData.name.trim()) {
      errs.name = '商品名称必填';
    }

    if (!formData.barcode.trim()) {
      errs.barcode = '条形码必填';
    }

    if (formData.defaultPurchasePrice < 0) {
      errs.defaultPurchasePrice = '采购价格不能小于 0';
    }

    if (formData.defaultRetailPrice < 0) {
      errs.defaultRetailPrice = '零售价格不能小于 0';
    }

    if (formData.referenceCostPrice < 0) {
      errs.referenceCostPrice = '参考成本价不能小于 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      baseDataApi.saveProduct(formData);
      alert('保存商品档案成功');
      navigate('/base/products');
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      {/* 页头 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/base/products')}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800">
              {code ? '编辑商品档案' : '新增商品档案'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">基础资料主数据管理</p>
          </div>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          
          {/* 商品编码 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              商品编码 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              disabled={!!code}
              placeholder="例如: SKU007 (保存后不可修改)"
              className={`h-9 text-xs font-mono font-bold uppercase ${
                errors.code ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.code && <span className="text-[10px] text-rose-500 font-bold block">{errors.code}</span>}
          </div>

          {/* 商品名称 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              商品名称 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="商品标准名称"
              className={`h-9 text-xs font-semibold ${
                errors.name ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.name && <span className="text-[10px] text-rose-500 font-bold block">{errors.name}</span>}
          </div>

          {/* 商品条码 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              条形码 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.barcode}
              onChange={e => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="69开头的EAN-13条码"
              className={`h-9 text-xs font-mono ${
                errors.barcode ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.barcode && <span className="text-[10px] text-rose-500 font-bold block">{errors.barcode}</span>}
          </div>

          {/* 分类 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">分类</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none"
            >
              <option value="办公文具">办公文具</option>
              <option value="书写工具">书写工具</option>
              <option value="办公用纸">办公用纸</option>
              <option value="办公电器">办公电器</option>
              <option value="数码周边">数码周边</option>
            </select>
          </div>

          {/* 规格型号 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">规格型号</label>
            <Input
              value={formData.spec}
              onChange={e => setFormData({ ...formData, spec: e.target.value })}
              placeholder="例如: 80g 500张/包 或 0.5mm"
              className="h-9 text-xs"
            />
          </div>

          {/* 计量单位 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">单位</label>
            <select
              value={formData.unit}
              onChange={e => setFormData({ ...formData, unit: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none"
            >
              <option value="个">个</option>
              <option value="盒">盒</option>
              <option value="支">支</option>
              <option value="包">包</option>
              <option value="台">台</option>
              <option value="箱">箱</option>
            </select>
          </div>

          {/* 默认采购价 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">默认采购价 (元)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.defaultPurchasePrice}
              onChange={e => setFormData({ ...formData, defaultPurchasePrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className={`h-9 text-xs font-bold ${
                errors.defaultPurchasePrice ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.defaultPurchasePrice && <span className="text-[10px] text-rose-500 font-bold block">{errors.defaultPurchasePrice}</span>}
          </div>

          {/* 默认零售价 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">默认零售价 (元)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.defaultRetailPrice}
              onChange={e => setFormData({ ...formData, defaultRetailPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className={`h-9 text-xs font-bold ${
                errors.defaultRetailPrice ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.defaultRetailPrice && <span className="text-[10px] text-rose-500 font-bold block">{errors.defaultRetailPrice}</span>}
          </div>

          {/* 参考成本价 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">参考成本价 (元)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.referenceCostPrice}
              onChange={e => setFormData({ ...formData, referenceCostPrice: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className={`h-9 text-xs font-bold ${
                errors.referenceCostPrice ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.referenceCostPrice && <span className="text-[10px] text-rose-500 font-bold block">{errors.referenceCostPrice}</span>}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/base/products')}
            className="h-9 px-4 font-bold bg-white"
          >
            取消
          </Button>
          <Button
            type="submit"
            className="h-9 px-4 flex items-center gap-1 font-bold bg-primary text-white"
          >
            <Save size={14} /> 保存
          </Button>
        </div>
      </form>
    </div>
  );
}
