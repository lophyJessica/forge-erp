import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { contractApi } from '../api/contract';
import type { Contract, ContractType } from '../types/contract';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ContractForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Contract | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (id) {
        const contract = contractApi.getContractById(id);
        if (!contract) throw new Error('合同不存在');
        if (contract.status !== 'DRAFT') {
          alert('只有草稿合同可以编辑');
          navigate(`/contracts/${contract.id}`);
          return;
        }
        setData({ ...contract });
      } else {
        setData(contractApi.createDraft('SALES'));
      }
    } catch (err: any) {
      alert(err.message || '初始化合同失败');
      navigate('/contracts');
    }
  }, [id, navigate]);

  if (!data) return <div className="p-8 text-center text-slate-400">正在初始化合同...</div>;

  const parties = contractApi.getParties(data.type).filter(item => item.status === 'active');

  const setType = (type: ContractType) => {
    const nextParties = contractApi.getParties(type).filter(item => item.status === 'active');
    const first = nextParties[0];
    setData({
      ...data,
      type,
      counterpartyCode: first?.code || '',
      counterpartyName: first?.name || ''
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!data.name.trim()) next.name = '合同名称必填';
    if (!data.counterpartyCode) next.counterpartyCode = '请选择对方';
    if (data.amount <= 0) next.amount = '金额必须大于 0';
    if (!data.signDate) next.signDate = '签订日期必填';
    if (!data.expireDate) next.expireDate = '到期日期必填';
    if (data.signDate && data.expireDate && data.expireDate < data.signDate) next.expireDate = '到期日期不能早于签订日期';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    try {
      const saved = contractApi.saveContract(data);
      alert('合同保存成功');
      navigate(`/contracts/${saved.id}`);
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  return (
    <div className="space-y-4 pb-20 text-xs">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3">
        <button type="button" onClick={() => navigate('/contracts')} className="p-1 hover:bg-slate-100 rounded">
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{id ? '编辑合同' : '新增合同'}</h1>
          <p className="text-slate-500 mt-1">合同号：<span className="font-mono font-bold text-primary">{data.id}</span></p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-5">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">合同信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="合同名称" error={errors.name}>
            <Input value={data.name} onChange={event => setData({ ...data, name: event.target.value })} placeholder="请输入合同名称" className={`h-9 text-xs ${errors.name ? 'border-rose-500' : ''}`} />
          </Field>

          <Field label="类型">
            <select value={data.type} onChange={event => setType(event.target.value as ContractType)} className="h-9 w-full rounded-md border border-slate-200 px-2 font-bold">
              <option value="SALES">销售</option>
              <option value="PURCHASE">采购</option>
            </select>
          </Field>

          <Field label={data.type === 'SALES' ? '客户' : '供应商'} error={errors.counterpartyCode}>
            <select
              value={data.counterpartyCode}
              onChange={event => {
                const party = parties.find(item => item.code === event.target.value);
                setData({ ...data, counterpartyCode: event.target.value, counterpartyName: party?.name || '' });
              }}
              className={`h-9 w-full rounded-md border px-2 font-bold ${errors.counterpartyCode ? 'border-rose-500' : 'border-slate-200'}`}
            >
              <option value="">请选择</option>
              {parties.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </Field>

          <Field label="金额" error={errors.amount}>
            <Input type="number" min="0" step="0.01" value={data.amount} onChange={event => setData({ ...data, amount: Number(event.target.value) })} className={`h-9 text-xs ${errors.amount ? 'border-rose-500' : ''}`} />
          </Field>

          <Field label="签订日期" error={errors.signDate}>
            <Input type="date" value={data.signDate} onChange={event => setData({ ...data, signDate: event.target.value })} className={`h-9 text-xs ${errors.signDate ? 'border-rose-500' : ''}`} />
          </Field>

          <Field label="到期日期" error={errors.expireDate}>
            <Input type="date" value={data.expireDate} onChange={event => setData({ ...data, expireDate: event.target.value })} className={`h-9 text-xs ${errors.expireDate ? 'border-rose-500' : ''}`} />
          </Field>

          <Field label="扫描件上传">
            <label className="h-9 rounded-md border border-slate-200 bg-white px-3 flex items-center gap-2 cursor-pointer hover:bg-slate-50">
              <Upload size={14} className="text-slate-400" />
              <span className="font-bold text-slate-600 truncate">{data.scanFileName || '选择文件模拟上传'}</span>
              <input
                type="file"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) setData({ ...data, scanFileName: file.name });
                }}
              />
            </label>
          </Field>

          <div className="rounded-md bg-slate-50 border border-slate-100 p-3 flex flex-col justify-center">
            <span className="font-semibold text-slate-400">金额预览</span>
            <span className="mt-1 text-lg font-black text-slate-800">¥{money(data.amount || 0)}</span>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="font-semibold text-slate-500 block">备注</label>
            <Textarea value={data.remark || ''} onChange={event => setData({ ...data, remark: event.target.value })} rows={4} className="text-xs" placeholder="请输入合同备注" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 py-3 px-6 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-40 flex justify-between items-center">
        <button type="button" onClick={() => navigate('/contracts')} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">返回列表</button>
        <Button size="sm" onClick={save} className="gap-1 font-bold">
          <Save size={14} />
          保存合同
        </Button>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-semibold text-slate-500 block">{label}</label>
      {children}
      {error && <p className="text-[10px] text-rose-500 font-bold">{error}</p>}
    </div>
  );
}
