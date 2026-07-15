import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react';
import NotificationBell from '../NotificationBell';
import AppShell from './AppShell';
import TopNav from './TopNav';

interface NavigationItem {
  label: string;
  path: string;
  exact?: boolean;
  badge?: string;
  badgeTone?: 'blue' | 'green';
}

interface NavigationGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    id: 'dashboard',
    label: '主工作台',
    icon: Home,
    items: [{ label: '控制台首页', path: '/', exact: true }],
  },
  {
    id: 'contracts',
    label: '合同管理',
    icon: FileText,
    items: [{ label: '合同管理', path: '/contracts' }],
  },
  {
    id: 'purchase',
    label: '采购业务管理',
    icon: Truck,
    items: [
      { label: '采购询比价', path: '/purchase/rfq', badge: 'RFQ', badgeTone: 'blue' },
      { label: '采购订单', path: '/purchase/orders', badge: '1.1版', badgeTone: 'green' },
      { label: '采购入库单', path: '/purchase/receipts' },
      { label: '采购退货单', path: '/purchase/returns' },
      { label: '采购退货出库单', path: '/purchase/return-outbounds' },
    ],
  },
  {
    id: 'sales',
    label: '销售业务管理',
    icon: ShoppingCart,
    items: [
      { label: '销售订单', path: '/sales/orders' },
      { label: '销售出库单', path: '/sales/outbounds' },
      { label: '销售退货单', path: '/sales/returns' },
    ],
  },
  {
    id: 'retail',
    label: '零售收银',
    icon: CreditCard,
    items: [
      { label: '收银工作台', path: '/retail', exact: true },
      { label: '零售单列表', path: '/retail/orders' },
      { label: '零售退货', path: '/retail/returns' },
    ],
  },
  {
    id: 'inventory',
    label: '库存管理',
    icon: Boxes,
    items: [
      { label: '即时库存查询', path: '/inventory/instant-stocks' },
      { label: '库存收发流水', path: '/inventory/flows' },
    ],
  },
  {
    id: 'finance',
    label: '往来管理',
    icon: ClipboardList,
    items: [
      { label: '应收管理', path: '/finance/receivables' },
      { label: '应付管理', path: '/finance/payables' },
      { label: '收款单 RC', path: '/finance/receipts' },
      { label: '付款单 PY', path: '/finance/payments' },
    ],
  },
  {
    id: 'reports',
    label: '经营分析',
    icon: BarChart3,
    items: [{ label: '报表中心', path: '/reports' }],
  },
  {
    id: 'base',
    label: '基础资料',
    icon: Package,
    items: [
      { label: '供应商档案', path: '/base/suppliers' },
      { label: '客户档案', path: '/base/customers' },
      { label: '商品档案', path: '/base/products' },
      { label: '价格管理', path: '/base/prices' },
      { label: '仓库档案', path: '/base/warehouses' },
    ],
  },
  {
    id: 'settings',
    label: '系统管理',
    icon: Settings,
    items: [
      { label: '系统设置', path: '/settings', exact: true },
      { label: '操作日志', path: '/settings/logs' },
    ],
  },
  {
    id: 'support',
    label: '操作支持',
    icon: BookOpen,
    items: [{ label: '操作手册', path: '/manual' }],
  },
];

function itemIsActive(item: NavigationItem, pathname: string) {
  return item.exact ? pathname === item.path : pathname.startsWith(item.path);
}

function findActiveGroup(pathname: string) {
  return navigationGroups.find(group => group.items.some(item => itemIsActive(item, pathname)))?.id ?? null;
}

function getBreadcrumb(pathname: string) {
  const section = pathname === '/'
    ? '主工作台'
    : pathname.startsWith('/inventory')
      ? '库存管理'
      : pathname.startsWith('/sales')
        ? '销售管理'
        : pathname.startsWith('/retail')
          ? '零售收银'
          : pathname.startsWith('/finance')
            ? '往来管理'
            : pathname.startsWith('/reports')
              ? '经营分析'
              : pathname.startsWith('/notifications')
                ? '消息中心'
                : pathname.startsWith('/manual')
                  ? '操作手册'
                  : pathname.startsWith('/contracts')
                    ? '合同管理'
                    : pathname.startsWith('/base')
                      ? '基础资料'
                      : pathname.startsWith('/settings')
                        ? '系统管理'
                        : '采购管理';

  const page = pathname === '/'
    ? '控制台首页'
    : pathname.startsWith('/sales/orders')
      ? '销售订单'
      : pathname.startsWith('/sales/outbounds')
        ? '销售出库单'
        : pathname.startsWith('/sales/returns')
          ? '销售退货单'
          : pathname === '/retail'
            ? '收银工作台'
            : pathname.startsWith('/retail/orders')
              ? '零售单列表'
              : pathname.startsWith('/retail/returns')
                ? '零售退货'
                : pathname.startsWith('/reports')
                  ? '报表中心'
                  : pathname.startsWith('/notifications')
                    ? '消息中心'
                    : pathname.startsWith('/manual')
                      ? '操作手册'
                      : pathname.startsWith('/contracts')
                        ? '合同管理'
                        : pathname.startsWith('/purchase/receipts')
                          ? '采购入库单'
                          : pathname.startsWith('/purchase/rfq')
                            ? '采购询比价'
                            : pathname.startsWith('/purchase/returns')
                              ? '采购退货单'
                              : pathname.startsWith('/purchase/return-outbounds')
                                ? '采购退货出库单'
                                : pathname.startsWith('/inventory/flows')
                                  ? '库存收发流水'
                                  : pathname.startsWith('/inventory/instant-stocks')
                                    ? '即时库存查询'
                                    : pathname.startsWith('/finance/receivables')
                                      ? '应收管理'
                                      : pathname.startsWith('/finance/payables')
                                        ? '应付管理'
                                        : pathname.startsWith('/finance/receipts')
                                          ? '收款单'
                                          : pathname.startsWith('/finance/payments')
                                            ? '付款单'
                                            : pathname.startsWith('/base/suppliers')
                                              ? '供应商档案'
                                              : pathname.startsWith('/base/customers')
                                                ? '客户档案'
                                                : pathname.startsWith('/base/products')
                                                  ? '商品档案'
                                                  : pathname.startsWith('/base/prices')
                                                    ? '价格管理'
                                                    : pathname.startsWith('/base/warehouses')
                                                      ? '仓库档案'
                                                      : pathname.startsWith('/settings/logs')
                                                        ? '操作日志'
                                                        : pathname.startsWith('/settings')
                                                          ? '系统设置'
                                                          : '采购订单';

  return [section, page];
}

interface NavigationSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onMobileClose: () => void;
}

function NavigationSidebar({
  collapsed,
  mobileOpen,
  onCollapsedChange,
  onMobileClose,
}: NavigationSidebarProps) {
  const location = useLocation();
  const activeGroup = findActiveGroup(location.pathname);
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(activeGroup ? [activeGroup] : []);

  React.useEffect(() => {
    if (activeGroup) {
      setExpandedGroups(current => current.includes(activeGroup) ? current : [...current, activeGroup]);
    }
    onMobileClose();
  }, [activeGroup, location.pathname, onMobileClose]);

  const toggleGroup = (groupId: string) => {
    if (collapsed) {
      onCollapsedChange(false);
      setExpandedGroups(current => current.includes(groupId) ? current : [...current, groupId]);
      return;
    }
    setExpandedGroups(current => current.includes(groupId)
      ? current.filter(id => id !== groupId)
      : [...current, groupId]);
  };

  return (
    <>
      <aside
        className={`app-sidebar forge-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`}
        style={{ '--forge-sidebar-width': collapsed ? '56px' : '200px' } as React.CSSProperties}
        aria-label="主导航"
      >
        <div className="forge-sidebar-mobile-header">
          <span>导航菜单</span>
          <button type="button" onClick={onMobileClose} aria-label="关闭导航菜单" title="关闭导航菜单">
            <X size={18} />
          </button>
        </div>

        <nav className="app-sidebar-nav forge-sidebar-nav">
          <div className="forge-nav-groups">
            {navigationGroups.map(group => {
              const Icon = group.icon;
              const isExpanded = expandedGroups.includes(group.id) && !collapsed;
              const isCurrentGroup = activeGroup === group.id;

              return (
                <div className={`forge-nav-group ${isExpanded ? 'is-expanded' : ''}`} key={group.id}>
                  <button
                    type="button"
                    className={`forge-nav-row forge-nav-group-trigger ${isCurrentGroup ? 'is-current' : ''}`}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`forge-nav-${group.id}`}
                    title={collapsed ? group.label : undefined}
                  >
                    <Icon className="forge-nav-icon" size={18} />
                    <span className="forge-nav-label">{group.label}</span>
                    <ChevronDown className="forge-nav-caret" size={14} />
                  </button>

                  <div
                    id={`forge-nav-${group.id}`}
                    className="forge-nav-submenu"
                    hidden={!isExpanded}
                  >
                    {group.items.map(item => {
                      const isActive = itemIsActive(item, location.pathname);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`forge-nav-subitem ${isActive ? 'is-active' : ''}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <span className="forge-nav-subitem-label">{item.label}</span>
                          {item.badge && (
                            <span className={`forge-nav-badge is-${item.badgeTone ?? 'blue'}`}>{item.badge}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        <button
          type="button"
          className="forge-sidebar-collapse"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? '展开菜单' : '收起菜单'}
          title={collapsed ? '展开菜单' : '收起菜单'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          <span className="forge-nav-label">收起菜单</span>
        </button>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="app-mobile-menu-backdrop forge-sidebar-backdrop"
          aria-label="关闭导航菜单"
          onClick={onMobileClose}
        />
      )}
    </>
  );
}

export default function ForgeLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => localStorage.getItem('forge-sidebar-collapsed') === 'true');
  const breadcrumb = getBreadcrumb(location.pathname);
  const topbarDate = React.useMemo(() => {
    const now = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${weekdays[now.getDay()]}`;
  }, []);

  const handleCollapsedChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem('forge-sidebar-collapsed', String(collapsed));
  };

  const handleMobileClose = React.useCallback(() => setIsMobileMenuOpen(false), []);

  return (
    <AppShell
      sidebar={(
        <NavigationSidebar
          collapsed={isCollapsed}
          mobileOpen={isMobileMenuOpen}
          onCollapsedChange={handleCollapsedChange}
          onMobileClose={handleMobileClose}
        />
      )}
      topNav={(
        <TopNav className="app-topbar h-16 px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="forge-mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="打开导航菜单"
              title="打开导航菜单"
            >
              <Menu size={19} />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{breadcrumb[0]}</span>
              <span aria-hidden="true">/</span>
              <span className="truncate text-slate-800">{breadcrumb[1]}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200" />
            <div className="forge-topbar-environment flex items-center gap-2 text-xs font-bold">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">演示环境</span>
              <span>{topbarDate}</span>
            </div>
          </div>
        </TopNav>
      )}
    >
      {children}
    </AppShell>
  );
}
