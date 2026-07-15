import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Receipt, RotateCcw, Search, WalletCards } from 'lucide-react';
import { retailApi } from '../api/retail';
import type { RetailOrder } from '../types/retail';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import PageTitle from '../components/shared/PageTitle';
import Pagination from '../components/shared/Pagination';
import { usePagination } from '../hooks/usePagination';

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RetailList() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<RetailOrder | null>(null);
  const orders = retailApi.getRetailOrders();

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter(order =>
      order.id.toLowerCase().includes(normalized)
      || order.cashierName.toLowerCase().includes(normalized)
      || retailApi.getPaymentLabel(order.paymentMethod).includes(keyword.trim())
    );
  }, [orders, keyword]);
  const { page, pageSize, pageRows, setPage, changePageSize } = usePagination(filtered);

  const totalPaid = filtered.reduce((sum, order) => sum + order.paidAmount, 0);
  const totalDiscount = filtered.reduce((sum, order) => sum + order.discountAmount + order.roundOffAmount, 0);

  return (
    <div className="space-y-4 pb-10 text-xs">
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40">
          <div className="w-[680px] max-w-[calc(100vw-32px)] rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-black text-primary">{selected.id}</p>
                <h2 className="mt-1 text-lg font-black text-slate-800">零售单查看</h2>
                <p className="mt-1 text-xs text-slate-500">结账时间：{selected.checkoutAt} / 收银员：{selected.cashierName}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>关闭</Button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-slate-400 font-bold">合计金额</p>
                  <p className="mt-1 text-lg font-black text-slate-800">¥{money(selected.totalAmount)}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                  <p className="text-amber-700 font-bold">折让 / 抹零</p>
                  <p className="mt-1 text-lg font-black text-amber-700">¥{money(selected.discountAmount + selected.roundOffAmount)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                  <p className="text-emerald-700 font-bold">实收金额</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">¥{money(selected.paidAmount)}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3">商品</th>
                      <th className="p-3 w-20 text-right">数量</th>
                      <th className="p-3 w-24 text-right">单价</th>
                      <th className="p-3 w-28 text-right">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.items.map(item => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{item.productName}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{item.productCode} / {item.productSpec}</p>
                        </td>
                        <td className="p-3 text-right font-bold">{item.quantity}</td>
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

      <PageTitle compact title="零售单列表" description="RS 全部为已确认记录，结账即扣减库存并完成收款核销。" actions={(
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="搜索 RS 单号 / 收银员 / 支付方式" className="h-9 pl-9 text-xs" />
        </div>
      )} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>零售单数</span>
            <Receipt size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-slate-800">{filtered.length}</div>
          <div className="text-[10px] font-bold text-slate-400">全部已确认，无草稿态</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>实收合计</span>
            <WalletCards size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">¥{money(totalPaid)}</div>
          <div className="text-[10px] font-bold text-slate-400">现金 / 微信 / 支付宝</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>折让与抹零</span>
            <WalletCards size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">¥{money(totalDiscount)}</div>
          <div className="text-[10px] font-bold text-slate-400">超过 50 元需店长授权</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-40">单号 RS</th>
                <th className="p-3 w-24">收银员</th>
                <th className="p-3 w-24 text-right">商品种数</th>
                <th className="p-3 w-28 text-right">合计金额</th>
                <th className="p-3 w-24 text-right">折让</th>
                <th className="p-3 w-28 text-right">实收</th>
                <th className="p-3 w-24">支付方式</th>
                <th className="p-3 w-40">结账时间</th>
                <th className="p-3 w-40">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pageRows.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono font-black text-primary">{order.id}</td>
                  <td className="p-3 font-bold text-slate-700">{order.cashierName}</td>
                  <td className="p-3 text-right font-semibold">{order.itemCount}</td>
                  <td className="p-3 text-right font-black text-slate-800">¥{money(order.totalAmount)}</td>
                  <td className="p-3 text-right font-bold text-amber-600">¥{money(order.discountAmount + order.roundOffAmount)}</td>
                  <td className="p-3 text-right font-black text-emerald-600">¥{money(order.paidAmount)}</td>
                  <td className="p-3">
                    <span className="rounded bg-slate-100 px-2 py-1 font-bold text-slate-600">{retailApi.getPaymentLabel(order.paymentMethod)}</span>
                  </td>
                  <td className="p-3 text-slate-500">{order.checkoutAt}</td>
                  <td className="p-3 flex items-center gap-1">
                    <button type="button" onClick={() => setSelected(order)} className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold text-primary hover:bg-primary/5">
                      <Eye size={13} />
                      查看
                    </button>
                    <button type="button" onClick={() => navigate(`/retail/returns/new?source_id=${order.id}`)} className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold text-emerald-600 hover:bg-emerald-50">
                      <RotateCcw size={13} />
                      退货
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">暂无零售单记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </div>
  );
}
