import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseWarehouse } from '../types/baseData';
import { baseDataApi } from '../api/baseData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';

export default function WarehouseForm() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [formData, setFormData] = useState<BaseWarehouse>({
    code: '',
    name: '',
    type: '分仓',
    manager: '',
    address: '',
    status: 'active'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (code) {
      const wh = baseDataApi.getWarehouseByCode(code);
      if (wh) {
        setFormData(JSON.parse(JSON.stringify(wh)));
      } else {
        alert('仓库不存在');
        navigate('/base/warehouses');
      }
    }
  }, [code]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) {
      errs.code = '仓库编码必填';
    } else if (!code && /[^a-zA-Z0-9_\-]/.test(formData.code)) {
      errs.code = '编码只支持英文字母、数字、下划线和中划线';
    }

    if (!formData.name.trim()) {
      errs.name = '仓库名称必填';
    }

    if (!formData.manager.trim()) {
      errs.manager = '仓储负责人必填';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      baseDataApi.saveWarehouse(formData);
      alert('保存仓库档案成功');
      navigate('/base/warehouses');
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
            onClick={() => navigate('/base/warehouses')}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800">
              {code ? '编辑仓库档案' : '新增仓库档案'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">基础资料主数据管理</p>
          </div>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          
          {/* 仓库编码 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              仓库编码 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              disabled={!!code}
              placeholder="例如: WH005 (保存后不可修改)"
              className={`h-9 text-xs font-mono font-bold uppercase ${
                errors.code ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.code && <span className="text-[10px] text-rose-500 font-bold block">{errors.code}</span>}
          </div>

          {/* 仓库名称 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              仓库名称 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="仓库名称"
              className={`h-9 text-xs font-semibold ${
                errors.name ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.name && <span className="text-[10px] text-rose-500 font-bold block">{errors.name}</span>}
          </div>

          {/* 仓库类型 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">仓库类型</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as '主仓' | '分仓' | '门店' })}
              className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none"
            >
              <option value="主仓">主仓</option>
              <option value="分仓">分仓</option>
              <option value="门店">门店</option>
            </select>
          </div>

          {/* 负责人 */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-500 block">
              负责人 <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.manager}
              onChange={e => setFormData({ ...formData, manager: e.target.value })}
              placeholder="仓库主管姓名"
              className={`h-9 text-xs font-medium ${
                errors.manager ? 'border-rose-500 bg-rose-50/10' : ''
              }`}
            />
            {errors.manager && <span className="text-[10px] text-rose-500 font-bold block">{errors.manager}</span>}
          </div>

          {/* 详细地址 */}
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-500 block">详细地址</label>
            <Input
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="请输入仓库具体地址以做物流派发依据"
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/base/warehouses')}
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
