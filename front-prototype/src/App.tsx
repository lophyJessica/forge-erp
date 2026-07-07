import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import PurchaseOrderList from './pages/PurchaseOrderList';
import PurchaseOrderForm from './pages/PurchaseOrderForm';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import PurchaseOrderImport from './pages/PurchaseOrderImport';
import PurchaseOrderExport from './pages/PurchaseOrderExport';
import RfqList from './pages/RfqList';
import RfqForm from './pages/RfqForm';
import RfqCompare from './pages/RfqCompare';
import SupplierPortal from './pages/SupplierPortal';
import StockInList from './pages/StockInList';
import StockInForm from './pages/StockInForm';
import StockInDetail from './pages/StockInDetail';
import InventoryFlowList from './pages/InventoryFlowList';
import InstantStockList from './pages/InstantStockList';
import PurchaseReturnList from './pages/PurchaseReturnList';
import PurchaseReturnForm from './pages/PurchaseReturnForm';
import PurchaseReturnDetail from './pages/PurchaseReturnDetail';
import PurchaseReturnOutboundList from './pages/PurchaseReturnOutboundList';
import PurchaseReturnOutboundForm from './pages/PurchaseReturnOutboundForm';
import PurchaseReturnOutboundDetail from './pages/PurchaseReturnOutboundDetail';
import SalesOrderList from './pages/SalesOrderList';
import SalesOrderForm from './pages/SalesOrderForm';
import SalesOrderDetail from './pages/SalesOrderDetail';
import SalesOutboundList from './pages/SalesOutboundList';
import SalesOutboundForm from './pages/SalesOutboundForm';
import SalesOutboundDetail from './pages/SalesOutboundDetail';
import SalesReturnList from './pages/SalesReturnList';
import SalesReturnForm from './pages/SalesReturnForm';
import SalesReturnDetail from './pages/SalesReturnDetail';
import ReceivableList from './pages/ReceivableList';
import ReceivableDetail from './pages/ReceivableDetail';
import PayableList from './pages/PayableList';
import PayableDetail from './pages/PayableDetail';
import ReceiptList from './pages/ReceiptList';
import ReceiptForm from './pages/ReceiptForm';
import PaymentList from './pages/PaymentList';
import PaymentForm from './pages/PaymentForm';
import RetailPOS from './pages/RetailPOS';
import RetailList from './pages/RetailList';
import RetailReturnList from './pages/RetailReturnList';
import RetailReturnForm from './pages/RetailReturnForm';
import ContractList from './pages/ContractList';
import ContractForm from './pages/ContractForm';
import ContractDetail from './pages/ContractDetail';
import SupplierList from './pages/SupplierList';
import SupplierForm from './pages/SupplierForm';
import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import WarehouseList from './pages/WarehouseList';
import WarehouseForm from './pages/WarehouseForm';
import PriceList from './pages/PriceList';
import SystemSettingsPage from './pages/Settings';
import AuditLog from './pages/AuditLog';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import NotificationCenter from './pages/NotificationCenter';
import NotificationBell from './components/NotificationBell';
import { 
  ClipboardList, ShoppingCart, BarChart3, Users, Settings, 
  Layers, Package, Menu, User, Home, ReceiptText, CreditCard, FileClock, FileText, BadgePercent
} from 'lucide-react';
import React from 'react';

// B 端后台布局组件
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // 判断左侧菜单激活态
  const isMenuChecked = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell flex min-h-screen bg-slate-50/50 text-slate-800 font-sans">
      {/* 侧边栏 */}
      <aside className={`app-sidebar w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 ${isMobileMenuOpen ? 'is-open' : ''}`}>
        {/* 系统 LOGO 区域 */}
        <div className="app-sidebar-brand h-16 flex items-center gap-2.5 px-6 border-b border-slate-800 bg-slate-950">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm tracking-wide">强盛科技Forge</h2>
            <p className="text-[10px] text-slate-500">Q强盛ERP控制台 v1.1</p>
          </div>
          <button
            type="button"
            className="app-mobile-menu-button"
            aria-label={isMobileMenuOpen ? '收起导航菜单' : '展开导航菜单'}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* 菜单导航 */}
        <nav className="app-sidebar-nav flex-1 px-4 py-6 space-y-7 overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}>
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">主工作台</span>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    location.pathname === '/'
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Home size={16} />
                    <span>控制台首页</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">合同管理</span>
            <ul className="space-y-1 text-xs font-medium">
              <li>
                <Link 
                  to="/contracts" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/contracts')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} />
                    <span>合同管理</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">采购业务管理</span>
            <ul className="space-y-1 text-xs font-medium">
              <li>
                <Link 
                  to="/purchase/rfq" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/purchase/rfq')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} />
                    <span>采购询比价</span>
                  </div>
                  <span className="inline-block px-1.5 py-0.2 text-[9px] bg-blue-500 text-white rounded font-bold">RFQ</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/purchase/orders" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/purchase/orders')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList size={16} />
                    <span>采购订单</span>
                  </div>
                  <span className="inline-block px-1.5 py-0.2 text-[9px] bg-emerald-500 text-white rounded font-bold">1.1版</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/purchase/receipts" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/purchase/receipts')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={16} />
                    <span>采购入库单</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/purchase/returns" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/purchase/returns')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={16} />
                    <span>采购退货单</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/purchase/return-outbounds" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/purchase/return-outbounds')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={16} />
                    <span>采购退货出库单</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">销售业务管理</span>
            <ul className="space-y-1 text-xs font-medium">
              <li>
                <Link 
                  to="/sales/orders" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/sales/orders')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList size={16} />
                    <span>销售订单</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/sales/outbounds" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/sales/outbounds')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={16} />
                    <span>销售出库单</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/sales/returns" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/sales/returns')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ReceiptText size={16} />
                    <span>销售退货单</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">零售收银</span>
            <ul className="space-y-1 text-xs font-medium">
              <li>
                <Link 
                  to="/retail" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    location.pathname === '/retail'
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={16} />
                    <span>收银工作台</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/retail/orders" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/retail/orders')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList size={16} />
                    <span>零售单列表</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/retail/returns" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/retail/returns')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ReceiptText size={16} />
                    <span>零售退货</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">库存管理</span>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/inventory/instant-stocks" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/inventory/instant-stocks')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package size={16} />
                    <span>即时库存查询</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/inventory/flows" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/inventory/flows')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package size={16} />
                    <span>库存收发流水</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">往来管理</span>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/finance/receivables" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/finance/receivables')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ReceiptText size={16} />
                    <span>应收管理</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/finance/payables" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/finance/payables')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ReceiptText size={16} />
                    <span>应付管理</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/finance/receipts" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/finance/receipts')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={16} />
                    <span>收款单 RC</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/finance/payments" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/finance/payments')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={16} />
                    <span>付款单 PY</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">经营分析</span>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/reports" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/reports')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 size={16} />
                    <span>报表中心</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">基础资料</span>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/base/suppliers" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/base/suppliers')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={16} />
                    <span>供应商档案</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/base/customers" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/base/customers')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={16} />
                    <span>客户档案</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/base/products" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/base/products')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers size={16} />
                    <span>商品档案</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/base/prices" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/base/prices')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BadgePercent size={16} />
                    <span>价格管理</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/base/warehouses" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/base/warehouses')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers size={16} />
                    <span>仓库档案</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">系统管理</span>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/settings" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    location.pathname === '/settings'
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={16} />
                    <span>系统设置</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link 
                  to="/settings/logs" 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                    isMenuChecked('/settings/logs')
                      ? 'bg-primary text-white font-bold' 
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileClock size={16} />
                    <span>操作日志</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* 底部用户信息 */}
        <div className="app-sidebar-user p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3 text-xs">
          <div className="bg-slate-800 p-2 rounded-full text-slate-300">
            <User size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white truncate">系统管理员</p>
            <p className="text-[10px] text-slate-500 truncate">admin@qiangsheng.com</p>
          </div>
        </div>
      </aside>

      {/* 主面板 */}
      <div className="app-main-panel flex-1 flex flex-col min-w-0">
        {/* 页头 */}
        <header className="app-topbar h-16 bg-white border-b border-slate-200/80 flex justify-between items-center px-8 shadow-sm">
          {/* 面包屑 */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>
              {location.pathname === '/'
                ? '主工作台'
                : location.pathname.startsWith('/inventory') 
                ? '库存管理' 
                : location.pathname.startsWith('/sales')
                ? '销售管理'
                : location.pathname.startsWith('/retail')
                ? '零售收银'
                : location.pathname.startsWith('/finance')
                ? '往来管理'
                : location.pathname.startsWith('/reports')
                ? '经营分析'
                : location.pathname.startsWith('/notifications')
                ? '消息中心'
                : location.pathname.startsWith('/contracts')
                ? '合同管理'
                : location.pathname.startsWith('/base') 
                ? '基础资料' 
                : location.pathname.startsWith('/settings')
                ? '系统管理'
                : '采购管理'}
            </span>
            <span>/</span>
            <span className="text-slate-800">
              {location.pathname === '/'
                ? '控制台首页'
                : location.pathname.startsWith('/sales/orders')
                ? '销售订单'
                : location.pathname.startsWith('/sales/outbounds')
                ? '销售出库单'
                : location.pathname.startsWith('/sales/returns')
                ? '销售退货单'
                : location.pathname === '/retail'
                ? '收银工作台'
                : location.pathname.startsWith('/retail/orders')
                ? '零售单列表'
                : location.pathname.startsWith('/retail/returns')
                ? '零售退货'
                : location.pathname.startsWith('/reports')
                ? '报表中心'
                : location.pathname.startsWith('/notifications')
                ? '消息中心'
                : location.pathname.startsWith('/contracts')
                ? '合同管理'
                : location.pathname.startsWith('/purchase/receipts') 
                ? '采购入库单' 
                : location.pathname.startsWith('/purchase/rfq')
                ? '采购询比价'
                : location.pathname.startsWith('/purchase/returns')
                ? '采购退货单'
                : location.pathname.startsWith('/purchase/return-outbounds')
                ? '采购退货出库单'
                : location.pathname.startsWith('/inventory/flows')
                ? '库存收发流水'
                : location.pathname.startsWith('/inventory/instant-stocks')
                ? '即时库存查询'
                : location.pathname.startsWith('/finance/receivables')
                ? '应收管理'
                : location.pathname.startsWith('/finance/payables')
                ? '应付管理'
                : location.pathname.startsWith('/finance/receipts')
                ? '收款单'
                : location.pathname.startsWith('/finance/payments')
                ? '付款单'
                : location.pathname.startsWith('/base/suppliers')
                ? '供应商档案'
                : location.pathname.startsWith('/base/customers')
                ? '客户档案'
                : location.pathname.startsWith('/base/products')
                ? '商品档案'
                : location.pathname.startsWith('/base/prices')
                ? '价格管理'
                : location.pathname.startsWith('/base/warehouses')
                ? '仓库档案'
                : location.pathname.startsWith('/settings/logs')
                ? '操作日志'
                : location.pathname.startsWith('/settings')
                ? '系统设置'
                : '采购订单'}
            </span>
          </div>

          {/* 顶部操作区 */}
          <div className="flex items-center gap-4 text-slate-600">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">演示环境</span>
              <span>2026-07-05 星期日</span>
            </div>
          </div>
        </header>

        {/* 内容页面容器 */}
        <main className="app-content flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// 包装组件以提供 Layout 上下文
function RouteWrapper({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <RouteWrapper>
              <Dashboard />
            </RouteWrapper>
          } 
        />
        
        <Route 
          path="/purchase/orders" 
          element={
            <RouteWrapper>
              <PurchaseOrderList />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/rfq" 
          element={
            <RouteWrapper>
              <RfqList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/rfq/new" 
          element={
            <RouteWrapper>
              <RfqForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/rfq/:id/compare" 
          element={
            <RouteWrapper>
              <RfqCompare />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/rfq/:id/edit" 
          element={
            <RouteWrapper>
              <RfqForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/rfq/:id" 
          element={
            <RouteWrapper>
              <RfqForm />
            </RouteWrapper>
          } 
        />

        <Route path="/supplier" element={<SupplierPortal />} />

        <Route 
          path="/reports" 
          element={
            <RouteWrapper>
              <Reports />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/notifications" 
          element={
            <RouteWrapper>
              <NotificationCenter />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/contracts" 
          element={
            <RouteWrapper>
              <ContractList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/contracts/new" 
          element={
            <RouteWrapper>
              <ContractForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/contracts/:id" 
          element={
            <RouteWrapper>
              <ContractDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/contracts/:id/edit" 
          element={
            <RouteWrapper>
              <ContractForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/sales/orders" 
          element={
            <RouteWrapper>
              <SalesOrderList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/orders/new" 
          element={
            <RouteWrapper>
              <SalesOrderForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/orders/:id" 
          element={
            <RouteWrapper>
              <SalesOrderDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/orders/:id/edit" 
          element={
            <RouteWrapper>
              <SalesOrderForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/outbounds" 
          element={
            <RouteWrapper>
              <SalesOutboundList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/outbounds/new" 
          element={
            <RouteWrapper>
              <SalesOutboundForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/outbounds/:id" 
          element={
            <RouteWrapper>
              <SalesOutboundDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/outbounds/:id/edit" 
          element={
            <RouteWrapper>
              <SalesOutboundForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/returns" 
          element={
            <RouteWrapper>
              <SalesReturnList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/returns/new" 
          element={
            <RouteWrapper>
              <SalesReturnForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/returns/:id" 
          element={
            <RouteWrapper>
              <SalesReturnDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/sales/returns/:id/edit" 
          element={
            <RouteWrapper>
              <SalesReturnForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/finance/receivables" 
          element={
            <RouteWrapper>
              <ReceivableList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/finance/receivables/:customerCode" 
          element={
            <RouteWrapper>
              <ReceivableDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/finance/payables" 
          element={
            <RouteWrapper>
              <PayableList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/finance/payables/:supplierCode" 
          element={
            <RouteWrapper>
              <PayableDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/finance/receipts" 
          element={
            <RouteWrapper>
              <ReceiptList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/finance/receipts/new" 
          element={
            <RouteWrapper>
              <ReceiptForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/finance/payments" 
          element={
            <RouteWrapper>
              <PaymentList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/finance/payments/new" 
          element={
            <RouteWrapper>
              <PaymentForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/retail" 
          element={
            <RouteWrapper>
              <RetailPOS />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/retail/orders" 
          element={
            <RouteWrapper>
              <RetailList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/retail/returns" 
          element={
            <RouteWrapper>
              <RetailReturnList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/retail/returns/new" 
          element={
            <RouteWrapper>
              <RetailReturnForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/orders/new" 
          element={
            <RouteWrapper>
              <PurchaseOrderForm />
            </RouteWrapper>
          } 
        />
        
        <Route 
          path="/purchase/orders/:id" 
          element={
            <RouteWrapper>
              <PurchaseOrderDetail />
            </RouteWrapper>
          } 
        />
        
        <Route 
          path="/purchase/orders/:id/edit" 
          element={
            <RouteWrapper>
              <PurchaseOrderForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/orders/import" 
          element={
            <RouteWrapper>
              <PurchaseOrderImport />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/orders/export" 
          element={
            <RouteWrapper>
              <PurchaseOrderExport />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/receipts" 
          element={
            <RouteWrapper>
              <StockInList />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/receipts/new" 
          element={
            <RouteWrapper>
              <StockInForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/receipts/:id" 
          element={
            <RouteWrapper>
              <StockInDetail />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/receipts/:id/edit" 
          element={
            <RouteWrapper>
              <StockInForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/inventory/flows" 
          element={
            <RouteWrapper>
              <InventoryFlowList />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/inventory/instant-stocks" 
          element={
            <RouteWrapper>
              <InstantStockList />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/returns" 
          element={
            <RouteWrapper>
              <PurchaseReturnList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/returns/new" 
          element={
            <RouteWrapper>
              <PurchaseReturnForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/returns/:id" 
          element={
            <RouteWrapper>
              <PurchaseReturnDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/returns/:id/edit" 
          element={
            <RouteWrapper>
              <PurchaseReturnForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/purchase/return-outbounds" 
          element={
            <RouteWrapper>
              <PurchaseReturnOutboundList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/return-outbounds/new" 
          element={
            <RouteWrapper>
              <PurchaseReturnOutboundForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/return-outbounds/:id" 
          element={
            <RouteWrapper>
              <PurchaseReturnOutboundDetail />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/purchase/return-outbounds/:id/edit" 
          element={
            <RouteWrapper>
              <PurchaseReturnOutboundForm />
            </RouteWrapper>
          } 
        />

        {/* 基础资料路由 */}
        <Route 
          path="/base/suppliers" 
          element={
            <RouteWrapper>
              <SupplierList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/suppliers/new" 
          element={
            <RouteWrapper>
              <SupplierForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/suppliers/:code/edit" 
          element={
            <RouteWrapper>
              <SupplierForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/base/customers" 
          element={
            <RouteWrapper>
              <CustomerList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/customers/new" 
          element={
            <RouteWrapper>
              <CustomerForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/customers/:code/edit" 
          element={
            <RouteWrapper>
              <CustomerForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/base/products" 
          element={
            <RouteWrapper>
              <ProductList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/products/new" 
          element={
            <RouteWrapper>
              <ProductForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/products/:code/edit" 
          element={
            <RouteWrapper>
              <ProductForm />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/base/prices" 
          element={
            <RouteWrapper>
              <PriceList />
            </RouteWrapper>
          } 
        />

        <Route 
          path="/base/warehouses" 
          element={
            <RouteWrapper>
              <WarehouseList />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/warehouses/new" 
          element={
            <RouteWrapper>
              <WarehouseForm />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/base/warehouses/:code/edit" 
          element={
            <RouteWrapper>
              <WarehouseForm />
            </RouteWrapper>
          } 
        />

        {/* 系统设置 */}
        <Route 
          path="/settings" 
          element={
            <RouteWrapper>
              <SystemSettingsPage />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/settings/logs" 
          element={
            <RouteWrapper>
              <AuditLog />
            </RouteWrapper>
          } 
        />
      </Routes>
    </HashRouter>
  );
}
