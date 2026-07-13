import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseProduct } from '../types/baseData';
import { baseDataApi } from '../api/baseData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Edit3, Plus, Power, RotateCcw, Search, Eye } from 'lucide-react';

export default function ProductList() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<BaseProduct[]>([]);

  const loadData = () => {
    const list = baseDataApi.getProducts();
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      setProducts(list.filter(x => 
        x.code.toLowerCase().includes(q) || 
        x.name.toLowerCase().includes(q) ||
        (x.barcode && x.barcode.toLowerCase().includes(q))
      ));
    } else {
      setProducts(list);
    }
  };

  useEffect(() => {
    loadData();
  }, [query]);

  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [disableReason, setDisableReason] = useState('');

  const handleToggleStatus = (code: string, currentStatus: string) => {
    if (currentStatus === 'active') {
      setSelectedCode(code);
      setDisableReason('');
      setIsDisableModalOpen(true);
    } else {
      if (window.confirm('是否确定启用该商品？')) {
        try {
          baseDataApi.toggleProductStatus(code, 'active');
          alert('商品已成功启用');
          loadData();
        } catch (e: any) {
          alert(e.message || '启用失败');
        }
      }
    }
  };

  const handleConfirmDisable = () => {
    if (!disableReason.trim()) {
      alert('请填写停用原因');
      return;
    }
    try {
      baseDataApi.toggleProductStatus(selectedCode, 'inactive', disableReason);
      alert('商品已成功停用');
      setIsDisableModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || '停用失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 搜索 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <form onSubmit={e => { e.preventDefault(); loadData(); }} className="flex flex-1 items-center gap-3">
          <div className="w-72">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索商品编码、名称、条码..."
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
          onClick={() => navigate('/base/products/new')}
          className="h-9 px-4 flex items-center gap-1 font-bold bg-primary text-white"
        >
          <Plus size={14} /> 新增商品
        </Button>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-32">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-32">条形码</th>
                <th className="p-3 w-28 text-center">分类</th>
                <th className="p-3 w-32">规格</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 w-24 text-right">安全库存</th>
                <th className="p-3 w-28 text-right">默认采购价</th>
                <th className="p-3 w-28 text-right">默认零售价</th>
                <th className="p-3 w-24 text-center">状态</th>
                <th className="p-3 w-36 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length > 0 ? (
                products.map(prod => {
                  const isInactive = prod.status === 'inactive';
                  return (
                    <tr 
                      key={prod.code} 
                      className={`transition-colors ${
                        isInactive ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-slate-50/20 text-slate-700'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold">{prod.code}</td>
                      <td className={`p-3 font-semibold ${isInactive ? 'text-slate-400' : 'text-slate-800'}`}>
                        {prod.name}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{prod.barcode || '-'}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                          {prod.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{prod.spec}</td>
                      <td className="p-3 text-slate-400">{prod.unit}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{prod.safetyStock ?? '-'}</td>
                      <td className="p-3 text-right font-bold text-slate-600">
                        ¥{prod.defaultPurchasePrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-extrabold text-primary">
                        ¥{prod.defaultRetailPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          isInactive 
                            ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {isInactive ? '已停用' : '已启用'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/base/products/${prod.code}`)}
                            className="text-slate-500 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                          >
                            <Eye size={13} /> 查看
                          </button>
                          <button
                            onClick={() => navigate(`/base/products/${prod.code}/edit`)}
                            className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                          >
                            <Edit3 size={13} /> 编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(prod.code, prod.status)}
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
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium bg-white">
                    没有找到符合条件的商品档案记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* 停用原因确认 Modal */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">确认停用商品</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">该操作会将当前商品状态标记为停用，请录入停用原因以供备案。</p>
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
