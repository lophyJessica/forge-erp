export type NotificationCategory =
  | 'STOCK_WARNING'
  | 'APPROVAL'
  | 'CONTRACT_EXPIRY'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'OTHER';

export type NotificationStatus = 'UNREAD' | 'READ';

export type NotificationTab = 'ALL' | NotificationStatus;

export interface NotificationMessage {
  id: string;
  category: NotificationCategory;
  title: string;
  summary: string;
  createdAt: string;
  status: NotificationStatus;
}
