import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Edit3, FileText, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { contractApi } from '../api/contract';
import type { Contract, ContractStatus, ContractType } from '../types/contract';
import { Button } from '../components/ui/Button';

const STATUS_LABEL: Record<ContractStatus, string> = {
  DRAFT: '草稿',
  ACTIVE: '执行中',
  EXPIRED: '已到期',
  TERMINATED: '已终止'
};

const STATUS_BADGE: Record<ContractStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200'
};

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function typeLabel(type: ContractType) {
  return type === 'PURCHASE' ? '采购' : '销售';
}

export default function ContractDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);

  const loadData = () => {
    if (!id) return;
    const next = contractApi.getContractById(id);
    if (!next) {
      alert('合同不存在');
      navigate('/contracts');
      return;
    }
    setContract(next);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!contract) return <div className="p-8 text-center text-slate-400">加载合同详情中...</div>;

  const runAction = (label: string, action: () => void, after?: () => void) => {
    try {
      action();
      alert(`${label}成功`);
      if (after) {
        after();
      } else {
        loadData();
      }
    } catch (err: any) {
      alert(err.message || `${label}失败`);
    }
  };

  return (
    <div className="space-y-4 pb-16 text-xs">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contracts')} className="p-1 hover:bg-slate-100 rounded">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">合同详情 {contract.id}</h1>
              <span className={`inline-flex rounded border px-2.5 py-0.5 font-bold ${STATUS_BADGE[contract.status]}`}>{STATUS_LABEL[contract.status]}</span>
            </div>
            <p className="text-slate-500 mt-1">{contract.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/contracts')} className="font-bold">返回列表</Button>
          {contract.status === 'DRAFT' && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate(`/contracts/${contract.id}/edit`)} className="gap-1 font-bold text-amber-600 border-amber-200">
                <Edit3 size={13} />
                编辑
              </Button>
              <Button size="sm" onClick={() => runAction('合同生效', () => contractApi.activateContract(contract.id))} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle size={13} />
                生效
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                if (window.confirm('确认删除该草稿合同？')) runAction('删除', () => contractApi.deleteContract(contract.id), () => navigate('/contracts'));
              }} className="gap-1 font-bold text-slate-500">
                <Trash2 size={13} />
                删除
              </Button>
            </>
          )}
          {contract.status === 'ACTIVE' && (
            <Button variant="outline" size="sm" onClick={() => {
              if (window.confirm('确认终止该执行中合同？')) runAction('终止', () => contractApi.terminateContract(contract.id));
            }} className="gap-1 font-bold text-rose-600 border-rose-200">
              <XCircle size={13} />
              终止
            </Button>
          )}
          {contract.status === 'EXPIRED' && (
            <Button size="sm" onClick={() => {
              const renewed = contractApi.renewContract(contract.id);
              alert('续约草稿已创建');
              navigate(`/contracts/${renewed.id}/edit`);
            }} className="gap-1 font-bold bg-emerald-600 hover:bg-emerald-700">
              <RefreshCw size={13} />
              续约
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <FileText size={16} className="text-slate-400" />
            基本信息
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Info label="合同号">{contract.id}</Info>
            <Info label="合同名称">{contract.name}</Info>
            <Info label="类型">{typeLabel(contract.type)}</Info>
            <Info label={contract.type === 'SALES' ? '客户' : '供应商'}>{contract.counterpartyName}</Info>
            <Info label="金额">¥{money(contract.amount)}</Info>
            <Info label="签订日期">{contract.signDate}</Info>
            <Info label="到期日期">{contract.expireDate}</Info>
            <Info label="扫描件">{contract.scanFileName || '-'}</Info>
          </div>
          <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <p className="font-semibold text-slate-400">备注</p>
            <p className="mt-1 font-bold text-slate-700 leading-6">{contract.remark || '-'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">制单信息</h3>
          <div className="space-y-3">
            <Info label="创建人">{contract.createdBy}</Info>
            <Info label="创建时间">{contract.createdAt}</Info>
            <Info label="生效人">{contract.activatedBy || '-'}</Info>
            <Info label="生效时间">{contract.activatedAt || '-'}</Info>
            <Info label="终止人">{contract.terminatedBy || '-'}</Info>
            <Info label="终止时间">{contract.terminatedAt || '-'}</Info>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="font-semibold text-slate-400 block">{label}</span>
      <span className="font-bold text-slate-700">{children}</span>
    </div>
  );
}
