import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, FileText, Package, RefreshCw, 
  ArrowRight, Activity, Calendar, AlertTriangle, 
  CheckCircle, Shield, TrendingUp, Users, ArrowUpRight
} from 'lucide-react';
import { purchaseOrderApi } from '../api/purchaseOrder';
import { purchaseReturnApi } from '../api/purchaseReturn';
import { purchaseReturnOutboundApi } from '../api/purchaseReturnOutbound';
import { stockInApi } from '../api/stockIn';

export default function Dashboard() {
  const navigate = useNavigate();

  // --- 动态日期获取 ---
  const [currentDateStr, setCurrentDateStr] = useState('');
  useEffect(() => {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const day = days[now.getDay()];
    setCurrentDateStr(`${y}年${m}月${d}日 ${day}`);
  }, []);

  // --- 动态统计数据计算 ---
  const [stats, setStats] = useState({
    todayDraftPO: 0,
    todayConfirmedPO: 0,
    todayApprovedPO: 0,
    pendingStockIn: 0,
    pendingReturn: 0,
    stockWarningCount: 0,
    monthInboundAmount: 0,
    monthOutboundAmount: 0
  });

  const loadStats = () => {
    const todayStr = '2026-07-05'; // 演示环境锁定今日日期
    const currentMonthPrefix = '2026-07';

    // 1. 今日采购订单
    const pos = purchaseOrderApi.getOrders();
    let todayDraftPO = 0;
    let todayConfirmedPO = 0;
    let todayApprovedPO = 0;
    let pendingStockIn = 0;

    pos.forEach((po: any) => {
      if (po.orderDate === todayStr) {
        if (po.status === 'DRAFT') todayDraftPO++;
        else if (po.status === 'CONFIRMED') todayConfirmedPO++;
        else if (po.status === 'APPROVED') todayApprovedPO++;
      }
      // 待入库订单统计
      if (po.status === 'APPROVED') {
        pendingStockIn++;
      }
    });

    // 2. 待退货单数 (PR处于DRAFT状态)
    let pendingReturn = 0;
    const prs = purchaseReturnApi.getReturns();
    prs.forEach((pr: any) => {
      if (pr.status === 'DRAFT') {
        pendingReturn++;
      }
    });

    // 3. 库存预警数可用量<安全库存
    let stockWarningCount = 0;
    const stocks = stockInApi.getInstantStocks();
    stocks.forEach((s: any) => {
      const safety = parseFloat(s.safetyStock);
      if (!isNaN(safety) && s.available < safety) {
        stockWarningCount++;
      }
    });

    // 4. 本月入库总金额
    let monthInboundAmount = 0;
    const pis = stockInApi.getStockIns();
    pis.forEach((pi: any) => {
      const inboundDate = pi.inboundDate || pi.stockInDate || '';
      if (pi.status === 'CONFIRMED' && inboundDate.startsWith(currentMonthPrefix)) {
        monthInboundAmount += pi.totalAmount;
      }
    });

    // 5. 本月退货出库总金额
    let monthOutboundAmount = 0;
    const pros = purchaseReturnOutboundApi.getOutbounds();
    pros.forEach((pro: any) => {
      if (pro.status === 'CONFIRMED' && pro.outboundDate.startsWith(currentMonthPrefix)) {
        monthOutboundAmount += pro.totalAmount;
      }
    });

    setStats({
      todayDraftPO,
      todayConfirmedPO,
      todayApprovedPO,
      pendingStockIn,
      pendingReturn,
      stockWarningCount,
      monthInboundAmount,
      monthOutboundAmount
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  // --- Mock 最近操作动态 ---
  const recentActivities = [
    { id: '1', operator: '系统管理员', time: '19:10:15', action: '确认退货出库单', target: 'PRO20260705-0001', type: 'PRO' },
    { id: '2', operator: '系统管理员', time: '18:48:04', action: '确认采购入库单', target: 'PI20260704-0005', type: 'PI' },
    { id: '3', operator: 'Buyer01', time: '14:30:00', action: '创建采购订单', target: 'PO20260705-0001', type: 'PO' },
    { id: '4', operator: '系统管理员', time: '11:20:00', action: '停用商品档案', target: 'SKU005', type: 'PRODUCT' },
    { id: '5', operator: 'Storekeeper01', time: '09:30:12', action: '确认采购入库单', target: 'PI20260704-0001', type: 'PI' }
  ];

  const handleTargetClick = (type: string, id: string) => {
    if (type === 'PO') navigate(`/purchase/orders/${id}`);
    else if (type === 'PI') navigate(`/purchase/receipts/${id}`);
    else if (type === 'PRO') navigate(`/purchase/return-outbounds/${id}`);
    else if (type === 'PRODUCT') navigate(`/base/products`);
  };

  return (
    <div className="space-y-6 pb-12 text-xs">
      
      {/* 顶部欢迎栏 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-800">您好，系统管理员！</h1>
          <p className="text-xs text-slate-500 mt-1">欢迎使用 Forge ERP 管理系统。今天您有新的待办事项需要处理，请及时查收。</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-full border border-slate-200/60 font-bold text-slate-600">
          <Calendar size={14} className="text-primary" />
          <span>{currentDateStr}</span>
        </div>
      </div>

      {/* 统计指标卡片行 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 指标1：今日采购订单 */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-slate-400">今日采购订单数</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <ShoppingCart size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-800">
              {stats.todayDraftPO + stats.todayConfirmedPO + stats.todayApprovedPO}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">单</span>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-[10px] text-slate-500 font-bold">
            <span>草稿 <strong className="text-slate-700">{stats.todayDraftPO}</strong></span>
            <span className="text-slate-300">|</span>
            <span>待审核 <strong className="text-amber-600">{stats.todayConfirmedPO}</strong></span>
            <span className="text-slate-300">|</span>
            <span>待入库 <strong className="text-emerald-600">{stats.todayApprovedPO}</strong></span>
          </div>
        </div>

        {/* 指标2：待处理工作量 */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-slate-400">待处理执行单数</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <FileText size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-slate-800">
              {stats.pendingStockIn + stats.pendingReturn}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">单</span>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-50 pt-2 text-[10px] text-slate-500 font-bold">
            <span>待入库 <strong className="text-primary">{stats.pendingStockIn}</strong></span>
            <span className="text-slate-300">|</span>
            <span>待退货出库 <strong className="text-rose-600">{stats.pendingReturn}</strong></span>
          </div>
        </div>

        {/* 指标3：库存预警商品数 */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-slate-400">库存预警商品数</span>
            <span className={`p-1.5 rounded ${stats.stockWarningCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-2xl font-black ${stats.stockWarningCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {stats.stockWarningCount}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">款</span>
          </div>
          <div className="border-t border-slate-50 pt-2 text-[10px] font-bold">
            {stats.stockWarningCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-500 animate-pulse"><AlertTriangle size={12} />有部分商品低于安全预警值！</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle size={12} />现存商品可用量充裕</span>
            )}
          </div>
        </div>

        {/* 指标4：本月入出库总金额 */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-slate-400">本月吞吐对账金额</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="flex flex-col mt-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-600">
              <span>入库应付:</span>
              <span className="text-slate-800 font-black">¥{stats.monthInboundAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-600 mt-1">
              <span>退货冲减:</span>
              <span className="text-emerald-600 font-black">¥{stats.monthOutboundAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-slate-50 pt-1 text-[9px] text-slate-400 font-medium">
            统计周期: 2026年7月整月账期
          </div>
        </div>
      </div>

      {/* 快捷入口 (3x2 格栅) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
          <Activity size={16} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
          工作台常用快捷入口
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <Link to="/purchase/orders" className="bg-slate-50/50 hover:bg-primary/5 p-4 rounded-lg border border-slate-200/50 flex flex-col items-center gap-2 group transition-all hover:-translate-y-0.5 shadow-sm">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
              <ShoppingCart size={18} />
            </span>
            <span className="font-bold text-slate-700">采购订单</span>
            <span className="text-[10px] text-slate-400">日常采购申请与审核</span>
          </Link>

          <Link to="/purchase/receipts" className="bg-slate-50/50 hover:bg-primary/5 p-4 rounded-lg border border-slate-200/50 flex flex-col items-center gap-2 group transition-all hover:-translate-y-0.5 shadow-sm">
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-full group-hover:scale-110 transition-transform">
              <FileText size={18} />
            </span>
            <span className="font-bold text-slate-700">采购入库</span>
            <span className="text-[10px] text-slate-400">实物接收与入库上架</span>
          </Link>

          <Link to="/purchase/returns" className="bg-slate-50/50 hover:bg-primary/5 p-4 rounded-lg border border-slate-200/50 flex flex-col items-center gap-2 group transition-all hover:-translate-y-0.5 shadow-sm">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
              <RefreshCw size={18} />
            </span>
            <span className="font-bold text-slate-700">采购退货</span>
            <span className="text-[10px] text-slate-400">退货申请与售后索赔</span>
          </Link>

          <Link to="/inventory/flows" className="bg-slate-50/50 hover:bg-primary/5 p-4 rounded-lg border border-slate-200/50 flex flex-col items-center gap-2 group transition-all hover:-translate-y-0.5 shadow-sm">
            <span className="p-2.5 bg-rose-50 text-rose-600 rounded-full group-hover:scale-110 transition-transform">
              <Activity size={18} />
            </span>
            <span className="font-bold text-slate-700">库存流水</span>
            <span className="text-[10px] text-slate-400">库存收发审计日志</span>
          </Link>

          <Link to="/inventory/instant-stocks" className="bg-slate-50/50 hover:bg-primary/5 p-4 rounded-lg border border-slate-200/50 flex flex-col items-center gap-2 group transition-all hover:-translate-y-0.5 shadow-sm">
            <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
              <Package size={18} />
            </span>
            <span className="font-bold text-slate-700">即时库存</span>
            <span className="text-[10px] text-slate-400">现存占用可用同屏查</span>
          </Link>

          <Link to="/base/suppliers" className="bg-slate-50/50 hover:bg-primary/5 p-4 rounded-lg border border-slate-200/50 flex flex-col items-center gap-2 group transition-all hover:-translate-y-0.5 shadow-sm">
            <span className="p-2.5 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
              <Users size={18} />
            </span>
            <span className="font-bold text-slate-700">基础资料</span>
            <span className="text-[10px] text-slate-400">主数据商品客户库房</span>
          </Link>

        </div>
      </div>

      {/* 最近操作动态 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <Activity size={16} className="text-primary" />
          最近操作动态 (实时审计)
        </h3>
        <div className="relative pl-6 border-l border-slate-100 space-y-6">
          {recentActivities.map(act => (
            <div key={act.id} className="relative">
              {/* 时间线圆点 */}
              <span className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-white ring-4 ring-primary/10" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/30 p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition-colors">
                <div>
                  <span className="font-bold text-slate-700">{act.operator}</span>
                  <span className="text-slate-400 mx-1.5">于 {act.time} 执行了</span>
                  <span className="font-semibold text-slate-800">{act.action}</span>
                  
                  {/* 可点击跳转单据 */}
                  <span 
                    onClick={() => handleTargetClick(act.type, act.target)}
                    className="font-mono font-black text-primary hover:underline cursor-pointer ml-2 bg-primary/5 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    {act.target}
                    <ArrowUpRight size={10} className="inline ml-0.5" />
                  </span>
                </div>
                
                <span className="text-[10px] text-slate-400 font-bold bg-white px-2 py-0.5 rounded border border-slate-200/50">
                  成功执行
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
