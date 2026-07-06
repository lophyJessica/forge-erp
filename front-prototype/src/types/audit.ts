export type AuditOperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'VOID' | 'CONFIRM';

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  operator: string;
  module: string;
  operationType: AuditOperationType;
  objectNo: string;
  detail: string;
}

export interface AuditLogQuery {
  operator?: string;
  operationType?: AuditOperationType | '';
  module?: string;
  dateStart?: string;
  dateEnd?: string;
  keyword?: string;
}

export const AUDIT_OPERATION_LABELS: Record<AuditOperationType, string> = {
  CREATE: '新增',
  UPDATE: '编辑',
  DELETE: '删除',
  APPROVE: '审核',
  VOID: '作废',
  CONFIRM: '确认',
};
