import React, { useEffect, useState } from 'react';
import { Bell, CalendarClock, CheckCircle2, CheckSquare, Info, MailOpen, Megaphone, PackageX, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { notificationApi } from '../api/notification';
import type { NotificationCategory, NotificationMessage, NotificationTab } from '../types/notification';
import PageTitle from '../components/shared/PageTitle';
import Pagination from '../components/shared/Pagination';
import StatusTabs from '../components/shared/StatusTabs';
import { usePagination } from '../hooks/usePagination';

const TABS: NotificationTab[] = ['ALL', 'UNREAD', 'READ'];

const TAB_LABEL: Record<NotificationTab, string> = {
  ALL: '全部',
  UNREAD: '未读',
  READ: '已读',
};

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  STOCK_WARNING: '库存预警',
  APPROVAL: '审批',
  CONTRACT_EXPIRY: '到期提醒',
  SYSTEM_ANNOUNCEMENT: '系统公告',
  OTHER: '其他',
};

const CATEGORY_ICON: Record<NotificationCategory, React.ReactNode> = {
  STOCK_WARNING: <PackageX size={15} />,
  APPROVAL: <CheckSquare size={15} />,
  CONTRACT_EXPIRY: <CalendarClock size={15} />,
  SYSTEM_ANNOUNCEMENT: <Megaphone size={15} />,
  OTHER: <Info size={15} />,
};

function categoryClass(category: NotificationCategory) {
  const maps: Record<NotificationCategory, string> = {
    STOCK_WARNING: 'bg-rose-50 text-rose-600 border-rose-100',
    APPROVAL: 'bg-amber-50 text-amber-600 border-amber-100',
    CONTRACT_EXPIRY: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    SYSTEM_ANNOUNCEMENT: 'bg-sky-50 text-sky-600 border-sky-100',
    OTHER: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return maps[category];
}

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('ALL');
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const { page, pageSize, pageRows, setPage, changePageSize } = usePagination(messages);

  const loadData = () => {
    setMessages(notificationApi.getNotifications(activeTab));
  };

  useEffect(() => {
    loadData();
    window.addEventListener(notificationApi.changeEvent, loadData);
    return () => window.removeEventListener(notificationApi.changeEvent, loadData);
  }, [activeTab]);

  const countOf = (tab: NotificationTab) => notificationApi.getNotifications(tab).length;
  const unreadCount = countOf('UNREAD');

  const markAsRead = (id: string) => {
    notificationApi.markAsRead(id);
  };

  const markAllAsRead = () => {
    if (unreadCount === 0) return;
    notificationApi.markAllAsRead();
  };

  const removeMessage = (id: string) => {
    if (window.confirm('确认删除该消息？')) {
      notificationApi.deleteNotification(id);
    }
  };

  return (
    <div className="space-y-4 pb-10 text-xs">
      <PageTitle compact title="消息中心" description="系统公告与待办提醒统一查看，可按全部、未读、已读筛选。" actions={(
        <Button size="sm" onClick={markAllAsRead} disabled={unreadCount === 0} className="gap-1 font-bold"><CheckCircle2 size={14} />全部已读</Button>
      )} />

      <StatusTabs
        className="rounded-t-lg shadow-sm"
        items={TABS.map(tab => ({ key: tab, label: TAB_LABEL[tab], count: countOf(tab) }))}
        activeKey={activeTab}
        onChange={key => setActiveTab(key as NotificationTab)}
        ariaLabel="消息状态筛选"
      />

      <div className="overflow-hidden rounded-b-lg border-x border-b border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-500">
                <th className="w-36 p-3">类型</th>
                <th className="min-w-64 p-3">标题</th>
                <th className="min-w-96 p-3">内容摘要</th>
                <th className="w-40 p-3">时间</th>
                <th className="w-24 p-3 text-center">状态</th>
                <th className="w-40 p-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/70 ${item.status === 'UNREAD' ? 'bg-primary/[0.02]' : ''}`}>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-bold ${categoryClass(item.category)}`}>
                      {CATEGORY_ICON[item.category]}
                      {CATEGORY_LABEL[item.category]}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {item.status === 'UNREAD' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                      <span className="font-black text-slate-800">{item.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{item.summary}</td>
                  <td className="p-3 font-semibold text-slate-500">{item.createdAt}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex rounded border px-2 py-0.5 font-bold ${
                      item.status === 'UNREAD'
                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      {item.status === 'UNREAD' ? '未读' : '已读'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {item.status === 'UNREAD' && (
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold text-primary hover:bg-primary/10"
                        >
                          <MailOpen size={13} />
                          标记已读
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMessage(item.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold text-slate-500 hover:bg-slate-100"
                      >
                        <Trash2 size={13} />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {messages.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Bell size={24} />
                      <span className="font-semibold">暂无消息</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} pageSize={pageSize} total={messages.length} onPageChange={setPage} onPageSizeChange={changePageSize} />
    </div>
  );
}
