import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  Minus,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  Smartphone,
  Trash2,
  WalletCards
} from 'lucide-react';
import { retailApi } from '../api/retail';
import type { RetailCartItem, RetailPaymentMethod, RetailProduct } from '../types/retail';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const PAYMENT_OPTIONS: Array<{ method: RetailPaymentMethod; label: string; icon: ReactNode; classes: string }> = [
  { method: 'CASH', label: '现金收款', icon: <Banknote size={16} />, classes: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { method: 'WECHAT', label: '微信收款', icon: <Smartphone size={16} />, classes: 'border-green-200 bg-green-50 text-green-700' },
  { method: 'ALIPAY', label: '支付宝收款', icon: <WalletCards size={16} />, classes: 'border-sky-200 bg-sky-50 text-sky-700' }
];

function money(value: number) {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toCartItem(product: RetailProduct): RetailCartItem {
  return {
    productCode: product.code,
    productName: product.name,
    productBarcode: product.barcode,
    productSpec: product.spec,
    unit: product.unit,
    quantity: 1,
    price: product.price
  };
}

export default function RetailPOS() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState<RetailProduct[]>(() => retailApi.getRetailProducts());
  const [cart, setCart] = useState<RetailCartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [roundOffAmount, setRoundOffAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<RetailPaymentMethod>('WECHAT');
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState('');

  const totals = useMemo(() => {
    const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const paidAmount = Math.max(totalAmount - discountAmount - roundOffAmount, 0);
    return {
      itemCount: cart.length,
      totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount,
      paidAmount
    };
  }, [cart, discountAmount, roundOffAmount]);

  const refreshProducts = (nextKeyword = keyword) => {
    setProducts(retailApi.getRetailProducts(nextKeyword));
  };

  const addToCart = (product: RetailProduct) => {
    if (product.stockQuantity <= 0) {
      setToast(`${product.name} 门店现存不足`);
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.productCode === product.code);
      if (idx === -1) return [...prev, toCartItem(product)];

      const next = [...prev];
      if (next[idx].quantity >= product.stockQuantity) {
        setToast(`${product.name} 已达到门店现存上限`);
        return next;
      }
      next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
      return next;
    });
  };

  const updateQty = (productCode: string, delta: number) => {
    const product = products.find(item => item.code === productCode);
    setCart(prev => prev.map(item => {
      if (item.productCode !== productCode) return item;
      const nextQty = Math.max(1, item.quantity + delta);
      if (product && nextQty > product.stockQuantity) {
        setToast(`${item.productName} 已达到门店现存上限`);
        return item;
      }
      return { ...item, quantity: nextQty };
    }));
  };

  const removeLine = (productCode: string) => {
    setCart(prev => prev.filter(item => item.productCode !== productCode));
  };

  const checkout = () => {
    try {
      const order = retailApi.checkout({
        cashierName: 'Cashier01',
        paymentMethod,
        items: cart,
        discountAmount,
        roundOffAmount
      });
      setCart([]);
      setDiscountAmount(0);
      setRoundOffAmount(0);
      refreshProducts();
      setToast(`结账成功，已生成 ${order.id}，请打印小票`);
      window.setTimeout(() => setToast(''), 3200);
    } catch (err: any) {
      if (err?.message === '需店长授权') {
        setAuthOpen(true);
      } else {
        setToast(err?.message || '结账失败');
      }
    }
  };

  return (
    <div className="space-y-4 pb-10 text-xs">
      {toast && (
        <div className="fixed right-6 top-20 z-30 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 shadow-lg">
          {toast}
        </div>
      )}

      {authOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40">
          <div className="w-[360px] rounded-lg bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <ShieldAlert size={20} />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-800">需店长授权</h2>
                <p className="mt-1 text-xs leading-6 text-slate-500">折让金额超过 50 元，当前收银员无权继续结账。请店长现场授权后再处理。</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={() => setAuthOpen(false)}>知道了</Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>购物车商品种数</span>
            <Receipt size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-slate-800">{totals.itemCount}</div>
          <div className="text-[10px] font-bold text-slate-400">共 {totals.totalQuantity} 件商品</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>合计金额</span>
            <WalletCards size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">¥{money(totals.totalAmount)}</div>
          <div className="text-[10px] font-bold text-slate-400">按默认零售价自动累加</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>折让与抹零</span>
            <ShieldAlert size={16} className={discountAmount > 50 ? 'text-amber-600' : 'text-slate-400'} />
          </div>
          <div className={`text-2xl font-black ${discountAmount > 50 ? 'text-amber-600' : 'text-slate-800'}`}>¥{money(discountAmount + roundOffAmount)}</div>
          <div className="text-[10px] font-bold text-slate-400">折让超过 50 元需授权</div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 h-28 flex flex-col justify-between">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>实收金额</span>
            <Banknote size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">¥{money(totals.paidAmount)}</div>
          <div className="text-[10px] font-bold text-slate-400">结账即收款核销</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_520px] gap-4">
        <section className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-black text-slate-800">零售收银工作台</h1>
              <p className="text-xs text-slate-500 mt-1">快速扫码或搜索商品，点击商品卡片加入购物车。</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/retail/orders')}>零售单列表</Button>
          </div>

          <form
            className="p-4 border-b border-slate-100"
            onSubmit={event => {
              event.preventDefault();
              refreshProducts();
            }}
          >
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={keyword}
                onChange={event => {
                  setKeyword(event.target.value);
                  refreshProducts(event.target.value);
                }}
                placeholder="输入商品编码 / 名称 / 条码"
                className="h-10 pl-9 text-xs"
              />
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 p-4">
            {products.map(product => (
              <button
                type="button"
                key={product.code}
                onClick={() => addToCart(product)}
                className="text-left rounded-lg border border-slate-100 bg-slate-50/60 p-4 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] font-bold text-primary">{product.code}</p>
                    <h3 className="mt-1 text-sm font-black text-slate-800 line-clamp-2">{product.name}</h3>
                  </div>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold ${product.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    现存 {product.stockQuantity}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <span>{product.spec}</span>
                  <span className="text-right">{product.barcode}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold text-slate-400">{product.category} / {product.unit}</span>
                  <span className="text-lg font-black text-slate-800">¥{money(product.price)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[680px]">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-800">购物车</h2>
            <p className="text-xs text-slate-500 mt-1">零售无草稿态，点击结账后立即扣减库存并完成收款。</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {cart.map(item => (
              <div key={item.productCode} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">{item.productName}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{item.productCode} / {item.productSpec}</p>
                  </div>
                  <button type="button" onClick={() => removeLine(item.productCode)} className="rounded p-1.5 text-rose-500 hover:bg-rose-50">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-[96px_1fr_92px] items-center gap-3">
                  <div className="flex items-center rounded-md border border-slate-200 overflow-hidden">
                    <button type="button" onClick={() => updateQty(item.productCode, -1)} className="h-8 w-8 flex items-center justify-center hover:bg-slate-50">
                      <Minus size={13} />
                    </button>
                    <span className="h-8 flex-1 flex items-center justify-center font-black">{item.quantity}</span>
                    <button type="button" onClick={() => updateQty(item.productCode, 1)} className="h-8 w-8 flex items-center justify-center hover:bg-slate-50">
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="text-right text-slate-500">¥{money(item.price)} / {item.unit}</div>
                  <div className="text-right font-black text-slate-800">¥{money(item.quantity * item.price)}</div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-slate-400">
                <Receipt size={34} className="mb-3" />
                <p className="font-bold">购物车为空</p>
                <p className="mt-1 text-[11px]">从左侧选择商品加入购物车</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="font-bold text-slate-500">折让金额</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={event => setDiscountAmount(Number(event.target.value || 0))}
                  className="h-9 text-xs bg-white"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-500">抹零</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={roundOffAmount}
                  onChange={event => setRoundOffAmount(Number(event.target.value || 0))}
                  className="h-9 text-xs bg-white"
                />
              </label>
            </div>

            <div className="rounded-lg bg-white border border-slate-100 p-4 space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>合计金额</span>
                <span className="font-bold text-slate-800">¥{money(totals.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>折让 + 抹零</span>
                <span className="font-bold text-amber-600">- ¥{money(discountAmount + roundOffAmount)}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-100 pt-2">
                <span className="font-bold text-slate-600">实收金额</span>
                <span className="text-2xl font-black text-emerald-600">¥{money(totals.paidAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map(option => (
                <button
                  key={option.method}
                  type="button"
                  onClick={() => setPaymentMethod(option.method)}
                  className={`h-10 rounded-md border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === option.method ? `${option.classes} ring-2 ring-primary/20` : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            <Button className="w-full h-11 text-sm font-black" disabled={cart.length === 0} onClick={checkout}>
              结账
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
