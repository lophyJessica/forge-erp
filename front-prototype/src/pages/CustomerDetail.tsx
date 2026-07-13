import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { baseDataApi } from '../api/baseData';
import { BaseCustomer } from '../types/baseData';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Edit3, Power, User } from 'lucide-react';

export default function CustomerDetail() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [data, setData] = useState<BaseCustomer | null>(null);

  // 停用弹窗状态
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  const loadData = () => {
    if (code) {
      const res = baseDataApi.getCustomerByCode(code);
      if (res) {
        setData(res);
      } else {
        alert('客户不存在');
        navigate('/base/customers');
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [code]);

  const handleToggleStatus = () => {
    if (!data) return;
    if (data.status === 'active') {
      setDisableReason('');
      setIsDisableModalOpen(true);
    } else {
      if (window.confirm('是否确定启用该客户？')) {
        try {
          baseDataApi.toggleCustomerStatus(data.code, 'active');
          alert('客户已启用');
          loadData();
        } catch (e: any) {
          alert(e.message || '启用失败');
        }
      }
    }
  };

  const handleConfirmDisable = () => {
    if (!data) return;
    if (!disableReason.trim()) {
      alert('请填写停用原因');
      return;
    }
    try {
      baseDataApi.toggleCustomerStatus(data.code, 'inactive', disableReason);
      alert('客户已停用');
      setIsDisableModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || '停用失败');
    }
  };

  if (!data) {
    return <div className="p-8 text-center text-xs text-slate-400 font-semibold">正在加载客户档案...</div>;
  }

  const isInactive = data.status === 'inactive';

  return (
    <div className="space-y-4 max-w-3xl mx-auto text-xs pb-12">
      {/* 页头 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/base/customers')}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-500"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <User size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-800">{data.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  isInactive 
                    ? 'bg-slate-100 text-slate-400 border-slate-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  {isInactive ? '已停用' : '已启用'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">编码：{data.code}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/base/customers/${data.code}/edit`)}
            className="flex items-center gap-1 font-semibold"
          >
            <Edit3 size={13} />
            <span>编辑客户</span>
          </Button>
          <Button
            size="sm"
            onClick={handleToggleStatus}
            className={`flex items-center gap-1 font-semibold ${
              isInactive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Power size={13} />
            <span>{isInactive ? '启用客户' : '停用客户'}</span>
          </Button>
        </div>
      </div>

      {/* 详情卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">基本信息</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block">客户编码</span>
            <span className="text-slate-800 font-bold font-mono text-[13px]">{data.code}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block">客户名称</span>
            <span className="text-slate-800 font-bold text-[13px]">{data.name}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block">联系人</span>
            <span className="text-slate-800 font-bold">{data.contact || '-'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block">联系电话</span>
            <span className="text-slate-800 font-bold font-mono">{data.phone || '-'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block">客户等级 (价格策略)</span>
            <span className="text-slate-800 font-bold">{data.priceLevel || '-'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block">信用额度 (元)</span>
            <span className="text-slate-800 font-bold font-mono">{data.creditLimit !== undefined ? data.creditLimit.toLocaleString() : '-'}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block">回款账期</span>
            <span className="text-slate-800 font-bold font-mono">{data.paymentPeriod ? `${data.paymentPeriod} 天` : '-'}</span>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <span className="text-slate-400 font-semibold block">备注</span>
            <span className="text-slate-800 font-semibold">{data.remark || '无备注'}</span>
          </div>
        </div>

        {isInactive && (data as any).disableReason && (
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-100 space-y-1">
            <span className="text-rose-500 font-bold block">停用备案原因</span>
            <span className="text-rose-700 font-medium">{(data as any).disableReason}</span>
          </div>
        )}
      </div>

      {/* 停用确认 Modal */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">确认停用客户</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">该操作会将当前客户状态标记为停用，请录入停用原因以供备案。</p>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">停用原因 <span className="text-rose-500">*</span></label>
              <textarea
                value={disableReason}
                onChange={e => setDisableReason(e.target.value)}
                placeholder="请输入停用原因（必填）..."
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-slate-700 font-medium"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsDisableModalOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleConfirmDisable} className="font-semibold bg-rose-600 hover:bg-rose-700">
                确认停用
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
