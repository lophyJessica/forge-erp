import { useMemo, useState } from 'react';
import { Eye, Receipt, Search, WalletCards } from 'lucide-react';
import { retailApi } from '../api/retail';
import type { RetailReturn } from '../types/retail';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RetailReturnList() {
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<RetailReturn | null>(null);
  const returns = retailApi.getRetailReturns();

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return returns;
    return returns.filter(item =>
      item.id.toLowerCase().includes(normalized)
      || item.sourceRetailOrderId.toLowerCase().includes(normalized)
      || item.cashierName.toLowerCase().includes(normalized)
      || retailApi.getPaymentLabel(item.paymentMethod).includes(keyword.trim())
    );
  }, [returns, keyword]);

  const totalRefund = filtered.reduce((sum, item) => sum + item.refundAmount, 0);

  return (
    <div className="space-y-4 pb-10 text-xs">
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40">
          <div className="w-[760px] max-w-[calc(100vw-32px)] rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-black text-primary">{selected.id}</p>
                <h2 className="mt-1 text-lg font-black text-slate-800">零售退货单查看</h2>
                <p className="mt-1 text-xs text-slate-500">来源零售单：{selected.sourceRetailOrderId} / 退货日期：{selected.returnDate}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>关闭</Button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-slate-400 font-bold">商品种数</p>
                  <p className="mt-1 text-lg font-black text-slate-800">{selected.itemCount}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                  <p className="text-emerald-700 font-bold">退款金额</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">¥{money(selected.refundAmount)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                  <p className="text-amber-700 font-bold">退款方式</p>
                  <p className="mt-1 text-lg font-black text-amber-700">{retailApi.getPaymentLabel(selected.paymentMethod)}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3">商品</th>
                      <th className="p-3 w-24 text-right">原购买数</th>
                      <th className="p-3 w-24 text-right">退货数</th>
                      <th className="p-3 w-24 text-right">单价</th>
                      <th className="p-3 w-28 text-right">退款小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.items.map(item => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{item.productName}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{item.productCode} / {item.productSpec}</p>
                        </td>
                        <td className="p-3 text-right font-bold">{item.purchaseQuantity}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{item.returnQuantity}</td>
                        <td className="p-3 text-right">¥{money(item.price)}</td>
                        <td className="p-3 text-right font-black">¥{money(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-black text-slate-800">零售退货</h1>
          <p className="text-xs text-slate-500 mt-1">零售退货必须从原零售单 RS 下推，确认后回补库存并按原支付方式退款。</p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索退货单 / RS / 收银员 / 支付方式" className="h-9 pl-9 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>退货单数</span>
            <Receipt size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-slate-800">{filtered.length}</div>
          <div className="text-[10px] font-bold text-slate-400">全部为已确认记录</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>退款合计</span>
            <WalletCards size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">¥{money(totalRefund)}</div>
          <div className="text-[10px] font-bold text-slate-400">现金 / 微信 / 支付宝原路退回</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>退货数量</span>
            <Receipt size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{filtered.reduce((sum, item) => sum + item.totalQuantity, 0)}</div>
          <div className="text-[10px] font-bold text-slate-400">确认即回补门店库存</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-40">退货单号</th>
                <th className="p-3 w-40">原零售单 RS</th>
                <th className="p-3 w-28">退货日期</th>
                <th className="p-3 w-24 text-right">商品种数</th>
                <th className="p-3 w-32 text-right">退款金额</th>
                <th className="p-3 w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-black text-primary">{item.id}</td>
                  <td className="p-3 font-mono font-bold text-slate-700">{item.sourceRetailOrderId}</td>
                  <td className="p-3 text-slate-500">{item.returnDate}</td>
                  <td className="p-3 text-right font-semibold">{item.itemCount}</td>
                  <td className="p-3 text-right font-black text-emerald-600">¥{money(item.refundAmount)}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold text-primary hover:bg-primary/5">
                      <Eye size={13} />
                      查看
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">暂无零售退货记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
