import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseSupplier } from '../types/baseData';
import { baseDataApi } from '../api/baseData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';

export default function SupplierForm() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [formData, setFormData] = useState<BaseSupplier>({
    code: '',
    name: '',
    contact: '',
    phone: '',
    settlementMethod: '月结',
    paymentPeriod: 30,
    status: 'active',
    remark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (code) {
      const sup = baseDataApi.getSupplierByCode(code);
      if (sup) {
        setFormData(JSON.parse(JSON.stringify(sup)));
      } else {
        alert('供应商不存在');
        navigate('/base/suppliers');
      }
    }
  }, [code]);

  // 当结算方式为现结时，账期强控为0并锁定
  useEffect(() => {
    if (formData.settlementMethod === '现结') {
      setFormData(prev => ({ ...prev, paymentPeriod: 0 }));
    }
  }, [formData.settlementMethod]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) {
      errs.code = '供应商编码必填';
    } else if (!code && /[^a-zA-Z0-9_\-]/.test(formData.code)) {
      errs.code = '编码只支持英文字母、数字、下划线和中划线';
    }

    if (!formData.name.trim()) {
      errs.name = '供应商名称必填';
    }

    if (formData.settlementMethod === '月结') {
      if (formData.paymentPeriod <= 0) {
        errs.paymentPeriod = '月结时，结算账期必须大于 0 天';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      baseDataApi.saveSupplier(formData);
      alert('保存供应商档案成功');
      navigate('/base/suppliers');
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      <PageHeader title={code ? '编辑供应商档案' : '新增供应商档案'} description="基础资料主数据管理" onBack={() => navigate('/base/suppliers')} />

      {/* 主表单 */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          
          {/* 供应商编码 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              供应商编码 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              disabled={!!code}
              placeholder="例如: VEND006 (保存后不可修改)"
              className={`h-9 text-xs font-mono font-bold uppercase ${
                errors.code ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.code && <span className="text-[10px] text-rose-500 font-bold block">{errors.code}</span>}
          </div>

          {/* 供应商名称 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              供应商名称 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入供应商的完整工商注册名称"
              className={`h-9 text-xs font-semibold ${
                errors.name ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.name && <span className="text-[10px] text-rose-500 font-bold block">{errors.name}</span>}
          </div>

          {/* 联系人 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">联系人</label>
            <Input
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: e.target.value })}
              placeholder="请输入首要对接联系人姓名"
              className="h-9 text-xs"
            />
          </div>

          {/* 联系电话 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">电话</label>
            <Input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="手机号或固定电话"
              className="h-9 text-xs"
            />
          </div>

          {/* 结算方式 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">结算方式</label>
            <select
              value={formData.settlementMethod}
              onChange={e => setFormData({ ...formData, settlementMethod: e.target.value as '月结' | '现结' })}
              className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none"
            >
              <option value="月结">月结</option>
              <option value="现结">现结</option>
            </select>
          </div>

          {/* 账期 (天) */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              结算账期 (天) {formData.settlementMethod === '月结' && <span className="text-rose-500">*</span>}
            </label>
            <Input
              type="number"
              value={formData.paymentPeriod}
              onChange={e => setFormData({ ...formData, paymentPeriod: parseInt(e.target.value, 10) || 0 })}
              disabled={formData.settlementMethod === '现结'}
              placeholder="例如: 30"
              className={`h-9 text-xs font-bold ${
                errors.paymentPeriod ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.paymentPeriod && <span className="text-[10px] text-rose-500 font-bold block">{errors.paymentPeriod}</span>}
          </div>

          {/* 备注 */}
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-500 block">备注</label>
            <textarea
              value={formData.remark || ''}
              onChange={e => setFormData({ ...formData, remark: e.target.value })}
              placeholder="选填，供应商附加合作说明..."
              className="w-full rounded-md border border-input px-3 py-2 text-xs text-slate-700 min-h-[60px] focus:outline-none"
            />
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/base/suppliers')}
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
