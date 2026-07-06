import React, { useMemo, useState } from 'react';
import { baseDataApi, type PriceLevelSummary } from '../api/baseData';
import { Button } from '../components/ui/Button';
import { BadgePercent, Clock3, PackageSearch, X } from 'lucide-react';

const formatMoney = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const changeTypeClass: Record<string, string> = {
  采购: 'bg-sky-50 text-sky-700 border-sky-100',
  销售: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  零售: 'bg-amber-50 text-amber-700 border-amber-100'
};

export default function PriceList() {
  const [selectedLevel, setSelectedLevel] = useState<PriceLevelSummary | null>(null);

  const levels = useMemo(() => baseDataApi.getPriceLevelSummaries(), []);
  const changes = useMemo(() => baseDataApi.getRecentPriceChanges(), []);
  const levelPrices = useMemo(() => {
    if (!selectedLevel) return [];
    return baseDataApi.getProductPricesByLevel(selectedLevel.level);
  }, [selectedLevel]);

  return (
    <div className="space-y-5 pb-10 text-xs">
      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.25fr] gap-5 items-start">
        <section className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h1 className="text-base font-black text-slate-800 flex items-center gap-2">
                <BadgePercent size={17} className="text-primary" /> 价格等级表
              </h1>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">客户等级默认折扣与覆盖商品数</p>
            </div>
            <span className="px-2 py-1 rounded bg-primary/10 text-primary font-bold text-[10px]">只读</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-3 min-w-24">客户等级</th>
                  <th className="p-3 w-28 text-right">默认折扣率</th>
                  <th className="p-3 w-28 text-right">商品SKU数</th>
                  <th className="p-3 w-32">最后更新</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {levels.map(level => (
                  <tr
                    key={level.level}
                    onClick={() => setSelectedLevel(level)}
                    className="hover:bg-primary/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-black text-slate-800">{level.level}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">点击查看全部商品价格</div>
                    </td>
                    <td className="p-3 text-right font-black text-primary">{level.defaultDiscountRate}%</td>
                    <td className="p-3 text-right font-bold text-slate-700">{level.skuCount}</td>
                    <td className="p-3 text-slate-500 font-medium">{level.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Clock3 size={17} className="text-primary" /> 最近价格变动
              </h2>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">采购、销售、零售价格调整留痕</p>
            </div>
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 font-bold text-[10px]">{changes.length} 条</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-3 w-24">商品编码</th>
                  <th className="p-3 min-w-44">名称</th>
                  <th className="p-3 w-24 text-right">原价</th>
                  <th className="p-3 w-24 text-right">新价</th>
                  <th className="p-3 w-24 text-center">变动类型</th>
                  <th className="p-3 w-24">操作人</th>
                  <th className="p-3 w-36">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {changes.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-700">{item.productCode}</td>
                    <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                    <td className="p-3 text-right font-bold text-slate-400">{formatMoney(item.oldPrice)}</td>
                    <td className="p-3 text-right font-black text-slate-800">{formatMoney(item.newPrice)}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${changeTypeClass[item.changeType] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        {item.changeType}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">{item.operator}</td>
                    <td className="p-3 text-slate-500 font-medium">{item.changedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedLevel && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[84vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <PackageSearch size={17} className="text-primary" /> {selectedLevel.level}商品价格
                </h3>
                <p className="mt-1 text-[11px] text-slate-400 font-medium">
                  默认折扣率 {selectedLevel.defaultDiscountRate}% · 共 {selectedLevel.skuCount} 个 SKU · 只读快照
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedLevel(null)} aria-label="关闭价格明细">
                <X size={18} />
              </Button>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-100 text-slate-500 font-bold">
                    <th className="p-3 w-24">商品编码</th>
                    <th className="p-3 min-w-52">商品名称</th>
                    <th className="p-3 w-32">分类</th>
                    <th className="p-3 w-32">规格</th>
                    <th className="p-3 w-28 text-right">基准零售价</th>
                    <th className="p-3 w-28 text-right">等级价格</th>
                    <th className="p-3 w-28 text-right">折扣率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {levelPrices.map(item => (
                    <tr key={`${item.level}-${item.productCode}`} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-700">{item.productCode}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                      <td className="p-3 text-slate-500">{item.category}</td>
                      <td className="p-3 text-slate-500">{item.spec}</td>
                      <td className="p-3 text-right font-bold text-slate-400">{formatMoney(item.baseRetailPrice)}</td>
                      <td className="p-3 text-right font-black text-primary">{formatMoney(item.levelPrice)}</td>
                      <td className="p-3 text-right font-bold text-slate-700">{item.discountRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
