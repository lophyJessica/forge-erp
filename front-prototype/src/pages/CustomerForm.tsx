import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseCustomer } from '../types/baseData';
import { baseDataApi } from '../api/baseData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';

export default function CustomerForm() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [formData, setFormData] = useState<BaseCustomer>({
    code: '',
    name: '',
    contact: '',
    phone: '',
    priceLevel: '三级',
    creditLimit: 0,
    paymentPeriod: 0,
    status: 'active',
    remark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (code) {
      const cust = baseDataApi.getCustomerByCode(code);
      if (cust) {
        setFormData(JSON.parse(JSON.stringify(cust)));
      } else {
        alert('客户不存在');
        navigate('/base/customers');
      }
    }
  }, [code]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) {
      errs.code = '客户编码必填';
    } else if (!code && /[^a-zA-Z0-9_\-]/.test(formData.code)) {
      errs.code = '编码只支持英文字母、数字、下划线和中划线';
    }

    if (!formData.name.trim()) {
      errs.name = '客户名称必填';
    }

    if (formData.creditLimit < 0) {
      errs.creditLimit = '信用额度不能小于 0 元';
    }

    if (formData.paymentPeriod < 0) {
      errs.paymentPeriod = '账期不能小于 0 天';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      baseDataApi.saveCustomer(formData);
      alert('保存客户档案成功');
      navigate('/base/customers');
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      <PageHeader title={code ? '编辑客户档案' : '新增客户档案'} description="基础资料主数据管理" onBack={() => navigate('/base/customers')} />

      {/* 主表单 */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          
          {/* 客户编码 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              客户编码 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              disabled={!!code}
              placeholder="例如: CUST006 (保存后不可修改)"
              className={`h-9 text-xs font-mono font-bold uppercase ${
                errors.code ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.code && <span className="text-[10px] text-rose-500 font-bold block">{errors.code}</span>}
          </div>

          {/* 客户名称 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              客户名称 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入客户单位的完整结算名称"
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
              placeholder="收货对接负责人"
              className="h-9 text-xs"
            />
          </div>

          {/* 联系电话 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">电话</label>
            <Input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="联系方式"
              className="h-9 text-xs"
            />
          </div>

          {/* 价格级别 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">价格级别</label>
            <select
              value={formData.priceLevel}
              onChange={e => setFormData({ ...formData, priceLevel: e.target.value as '一级' | '二级' | '三级' })}
              className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none"
            >
              <option value="一级">一级客户 (最优惠)</option>
              <option value="二级">二级客户</option>
              <option value="三级">三级客户 (普通)</option>
            </select>
          </div>

          {/* 信用额度 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">信用额度 (元)</label>
            <Input
              type="number"
              value={formData.creditLimit}
              onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
              placeholder="允许欠款赊账的上限"
              className={`h-9 text-xs font-bold ${
                errors.creditLimit ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.creditLimit && <span className="text-[10px] text-rose-500 font-bold block">{errors.creditLimit}</span>}
          </div>

          {/* 账期 (天) */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">结算账期 (天)</label>
            <Input
              type="number"
              value={formData.paymentPeriod}
              onChange={e => setFormData({ ...formData, paymentPeriod: parseInt(e.target.value, 10) || 0 })}
              placeholder="欠款最大天数"
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
              placeholder="客户特殊收货偏好或开票事项..."
              className="w-full rounded-md border border-input px-3 py-2 text-xs text-slate-700 min-h-[60px] focus:outline-none"
            />
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/base/customers')}
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
