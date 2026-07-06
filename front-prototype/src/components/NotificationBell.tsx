import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, CheckSquare, Info, Megaphone, PackageX } from 'lucide-react';
import { notificationApi } from '../api/notification';
import type { NotificationCategory, NotificationMessage } from '../types/notification';

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  STOCK_WARNING: '库存预警',
  APPROVAL: '审批',
  CONTRACT_EXPIRY: '到期提醒',
  SYSTEM_ANNOUNCEMENT: '系统公告',
  OTHER: '其他',
};

const CATEGORY_ICON: Record<NotificationCategory, React.ReactNode> = {
  STOCK_WARNING: <PackageX size={14} />,
  APPROVAL: <CheckSquare size={14} />,
  CONTRACT_EXPIRY: <CalendarClock size={14} />,
  SYSTEM_ANNOUNCEMENT: <Megaphone size={14} />,
  OTHER: <Info size={14} />,
};

function categoryClass(category: NotificationCategory) {
  const maps: Record<NotificationCategory, string> = {
    STOCK_WARNING: 'bg-rose-50 text-rose-600',
    APPROVAL: 'bg-amber-50 text-amber-600',
    CONTRACT_EXPIRY: 'bg-indigo-50 text-indigo-600',
    SYSTEM_ANNOUNCEMENT: 'bg-sky-50 text-sky-600',
    OTHER: 'bg-slate-100 text-slate-500',
  };
  return maps[category];
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<NotificationMessage[]>([]);

  const loadData = () => {
    setUnreadCount(notificationApi.getUnreadCount());
    setMessages(notificationApi.getUnreadNotifications(5));
  };

  useEffect(() => {
    loadData();
    window.addEventListener(notificationApi.changeEvent, loadData);
    return () => window.removeEventListener(notificationApi.changeEvent, loadData);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const viewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="p-1.5 hover:bg-slate-100 rounded-full relative cursor-pointer"
        aria-label="消息通知"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center font-black shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-96 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-800">消息通知</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">最近 5 条未读消息</p>
            </div>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">
              {unreadCount} 未读
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {messages.map(item => (
              <Link
                key={item.id}
                to="/notifications"
                onClick={() => setOpen(false)}
                className="flex gap-3 border-b border-slate-50 px-4 py-3 hover:bg-slate-50"
              >
                <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded ${categoryClass(item.category)}`}>
                  {CATEGORY_ICON[item.category]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-xs font-black text-slate-800">{item.title}</span>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                      {CATEGORY_LABEL[item.category]}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">{item.summary}</span>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-400">{item.createdAt}</span>
                </span>
              </Link>
            ))}

            {messages.length === 0 && (
              <div className="px-4 py-8 text-center text-xs font-semibold text-slate-400">
                暂无未读消息
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={viewAll}
            className="w-full border-t border-slate-100 px-4 py-3 text-center text-xs font-black text-primary hover:bg-primary/5"
          >
            查看全部
          </button>
        </div>
      )}
    </div>
  );
}
