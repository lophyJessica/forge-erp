import type { NotificationMessage, NotificationTab } from '../types/notification';

const STORAGE_KEY = 'qs_notifications_v1';
const CHANGE_EVENT = 'qs-notification-change';

function initialNotifications(): NotificationMessage[] {
  return [
    {
      id: 'NT20260706-001',
      category: 'STOCK_WARNING',
      title: '晨光中性笔库存低于安全库存',
      summary: 'SKU001 在上海主仓可用量 18 支，低于安全库存 30 支，请及时补货。',
      createdAt: '2026-07-06 09:35:00',
      status: 'UNREAD',
    },
    {
      id: 'NT20260706-002',
      category: 'APPROVAL',
      title: '采购订单 PO20260706-0001 待审核',
      summary: '北京强盛贸易有限公司采购订单已提交，金额 12,860.00 元，等待采购主管审核。',
      createdAt: '2026-07-06 09:12:00',
      status: 'UNREAD',
    },
    {
      id: 'NT20260706-003',
      category: 'CONTRACT_EXPIRY',
      title: '杭州中盛仓储设备采购合同即将到期',
      summary: '合同 CT20260628-0001 将于 2026-09-30 到期，请提前确认续约或关闭计划。',
      createdAt: '2026-07-06 08:40:00',
      status: 'UNREAD',
    },
    {
      id: 'NT20260705-001',
      category: 'SYSTEM_ANNOUNCEMENT',
      title: '系统公告：本周日凌晨进行例行维护',
      summary: '系统将于 2026-07-12 01:00-02:00 进行维护，维护期间可能短暂不可用。',
      createdAt: '2026-07-05 18:00:00',
      status: 'UNREAD',
    },
    {
      id: 'NT20260705-002',
      category: 'STOCK_WARNING',
      title: '蓝色文件夹库存触发预警',
      summary: 'SKU008 在北京仓可用量 6 个，低于安全库存 20 个，建议发起补货。',
      createdAt: '2026-07-05 16:25:00',
      status: 'UNREAD',
    },
    {
      id: 'NT20260705-003',
      category: 'APPROVAL',
      title: '销售退货单 SR20260705-0002 待审核',
      summary: '广州大学城红叶书店提交销售退货申请，请确认退货原因和入库仓库。',
      createdAt: '2026-07-05 15:10:00',
      status: 'UNREAD',
    },
    {
      id: 'NT20260704-001',
      category: 'OTHER',
      title: '报表导出任务已完成',
      summary: '库存收发流水台账导出任务已完成，可在下载中心查看导出文件。',
      createdAt: '2026-07-04 19:45:00',
      status: 'READ',
    },
    {
      id: 'NT20260704-002',
      category: 'CONTRACT_EXPIRY',
      title: '上海腾飞电子配件采购框架合同需复核',
      summary: '合同 CT20260210-0001 距离到期不足 150 天，请合同管理员跟进采购框架协议。',
      createdAt: '2026-07-04 14:30:00',
      status: 'READ',
    },
    {
      id: 'NT20260703-001',
      category: 'APPROVAL',
      title: '付款单 PY20260703-0001 待审核',
      summary: '广州力行包装材料公司付款单已提交，金额 90.00 元，请财务主管审核。',
      createdAt: '2026-07-03 11:20:00',
      status: 'READ',
    },
    {
      id: 'NT20260703-002',
      category: 'SYSTEM_ANNOUNCEMENT',
      title: '系统公告：新增操作日志审计视图',
      summary: '系统管理模块已上线操作日志查询能力，支持按操作人、业务模块和时间筛选。',
      createdAt: '2026-07-03 09:00:00',
      status: 'READ',
    },
    {
      id: 'NT20260702-001',
      category: 'STOCK_WARNING',
      title: 'U盘 32G 库存接近安全库存',
      summary: 'SKU005 在深圳仓可用量 22 个，接近安全库存阈值，请关注近期销售出库。',
      createdAt: '2026-07-02 17:05:00',
      status: 'READ',
    },
    {
      id: 'NT20260702-002',
      category: 'OTHER',
      title: '基础资料同步完成',
      summary: '供应商、客户和商品档案的演示数据同步已完成，可继续进行业务单据演示。',
      createdAt: '2026-07-02 10:15:00',
      status: 'READ',
    },
  ];
}

function readNotifications() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialNotifications();
  try {
    const list = JSON.parse(raw) as NotificationMessage[];
    return Array.isArray(list) ? list : initialNotifications();
  } catch {
    return initialNotifications();
  }
}

function writeNotifications(list: NotificationMessage[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function sorted(list: NotificationMessage[]) {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export const notificationApi = {
  changeEvent: CHANGE_EVENT,

  getNotifications(tab: NotificationTab = 'ALL'): NotificationMessage[] {
    return sorted(readNotifications()).filter(item => tab === 'ALL' || item.status === tab);
  },

  getUnreadNotifications(limit = 5): NotificationMessage[] {
    return this.getNotifications('UNREAD').slice(0, limit);
  },

  getUnreadCount() {
    return readNotifications().filter(item => item.status === 'UNREAD').length;
  },

  markAsRead(id: string) {
    writeNotifications(readNotifications().map(item => (
      item.id === id ? { ...item, status: 'READ' } : item
    )));
  },

  markAllAsRead() {
    writeNotifications(readNotifications().map(item => ({ ...item, status: 'READ' })));
  },

  deleteNotification(id: string) {
    writeNotifications(readNotifications().filter(item => item.id !== id));
  },
};
