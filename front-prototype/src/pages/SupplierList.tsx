import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseSupplier } from '../types/baseData';
import { baseDataApi } from '../api/baseData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, RotateCcw, Plus, Edit3, Power } from 'lucide-react';

export default function SupplierList() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [suppliers, setSuppliers] = useState<BaseSupplier[]>([]);

  const loadData = () => {
    const list = baseDataApi.getSuppliers();
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      setSuppliers(list.filter(x => 
        x.code.toLowerCase().includes(q) || 
        x.name.toLowerCase().includes(q) ||
        (x.contact && x.contact.toLowerCase().includes(q))
      ));
    } else {
      setSuppliers(list);
    }
  };

  useEffect(() => {
    loadData();
  }, [query]);

  const handleToggleStatus = (code: string) => {
    try {
      const updated = baseDataApi.toggleSupplierStatus(code);
      alert(`供应商【${updated.name}】已成功${updated.status === 'active' ? '启用' : '停用'}`);
      loadData();
    } catch (e: any) {
      alert(e.message || '操作失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜索卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <form onSubmit={e => { e.preventDefault(); loadData(); }} className="flex flex-1 items-center gap-3">
          <div className="w-72">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索供应商编码、名称、联系人..."
              className="h-9 text-xs"
            />
          </div>
          <Button type="submit" className="h-9 px-4 flex items-center gap-1 font-bold">
            <Search size={14} /> 搜索
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setQuery('')}
            className="h-9 px-4 flex items-center gap-1 font-bold"
          >
            <RotateCcw size={14} /> 重置
          </Button>
        </form>

        <Button
          onClick={() => navigate('/base/suppliers/new')}
          className="h-9 px-4 flex items-center gap-1 font-bold bg-primary text-white"
        >
          <Plus size={14} /> 新增供应商
        </Button>
      </div>

      {/* 数据列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-32">编码</th>
                <th className="p-3">供应商名称</th>
                <th className="p-3 w-32">联系人</th>
                <th className="p-3 w-36">电话</th>
                <th className="p-3 w-28">结算方式</th>
                <th className="p-3 w-24 text-right">账期 (天)</th>
                <th className="p-3 w-24 text-center">状态</th>
                <th className="p-3">备注</th>
                <th className="p-3 w-36 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.length > 0 ? (
                suppliers.map(sup => {
                  const isInactive = sup.status === 'inactive';
                  return (
                    <tr 
                      key={sup.code} 
                      className={`transition-colors ${
                        isInactive ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-slate-50/20 text-slate-700'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold">{sup.code}</td>
                      <td className={`p-3 font-semibold ${isInactive ? 'text-slate-400' : 'text-slate-800'}`}>
                        {sup.name}
                      </td>
                      <td className="p-3 font-medium">{sup.contact || '-'}</td>
                      <td className="p-3 text-slate-500 font-medium">{sup.phone || '-'}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          sup.settlementMethod === '月结' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {sup.settlementMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold">{sup.paymentPeriod}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isInactive 
                            ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {isInactive ? '已停用' : '已启用'}
                        </span>
                      </td>
                      <td className="p-3 truncate max-w-[200px]" title={sup.remark}>
                        {sup.remark || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/base/suppliers/${sup.code}/edit`)}
                            className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                          >
                            <Edit3 size={13} /> 编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(sup.code)}
                            className={`flex items-center gap-0.5 cursor-pointer font-bold ${
                              isInactive ? 'text-emerald-600 hover:text-emerald-700' : 'text-rose-500 hover:text-rose-600'
                            }`}
                          >
                            <Power size={13} /> {isInactive ? '启用' : '停用'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium bg-white">
                    没有找到符合条件的供应商档案记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
