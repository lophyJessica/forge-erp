import {
  AUDIT_OPERATION_LABELS,
  AuditLogQuery,
  AuditLogRecord,
  AuditOperationType,
} from '../types/audit';

const operators = ['admin', 'Buyer01', 'Sales01', 'Storekeeper01', 'Storekeeper02', 'Cashier01', 'Finance01'];

const auditTargets: Array<{
  module: string;
  prefix: string;
  objectName: string;
  operations: AuditOperationType[];
}> = [
  { module: '采购订单', prefix: 'PO', objectName: '采购订单', operations: ['CREATE', 'UPDATE', 'APPROVE', 'VOID', 'DELETE'] },
  { module: '采购入库单', prefix: 'PI', objectName: '采购入库单', operations: ['CREATE', 'UPDATE', 'CONFIRM', 'VOID', 'DELETE'] },
  { module: '采购退货单', prefix: 'PR', objectName: '采购退货单', operations: ['CREATE', 'UPDATE', 'CONFIRM', 'VOID'] },
  { module: '销售订单', prefix: 'SO', objectName: '销售订单', operations: ['CREATE', 'UPDATE', 'APPROVE', 'VOID', 'DELETE'] },
  { module: '销售出库单', prefix: 'SOO', objectName: '销售出库单', operations: ['CREATE', 'CONFIRM', 'VOID'] },
  { module: '零售单', prefix: 'RS', objectName: '零售单', operations: ['CREATE', 'CONFIRM', 'DELETE'] },
  { module: '库存流水', prefix: 'FL', objectName: '库存流水台账', operations: ['CREATE', 'CONFIRM'] },
  { module: '即时库存', prefix: 'STK', objectName: '即时库存记录', operations: ['UPDATE', 'CONFIRM'] },
  { module: '商品档案', prefix: 'SKU', objectName: '商品档案', operations: ['CREATE', 'UPDATE', 'DELETE'] },
  { module: '客户档案', prefix: 'CUST', objectName: '客户档案', operations: ['CREATE', 'UPDATE', 'DELETE'] },
  { module: '供应商档案', prefix: 'VEND', objectName: '供应商档案', operations: ['CREATE', 'UPDATE', 'DELETE'] },
  { module: '仓库档案', prefix: 'WH', objectName: '仓库档案', operations: ['CREATE', 'UPDATE', 'DELETE'] },
  { module: '应收管理', prefix: 'AR', objectName: '应收记录', operations: ['CREATE', 'CONFIRM', 'UPDATE'] },
  { module: '应付管理', prefix: 'AP', objectName: '应付记录', operations: ['CREATE', 'CONFIRM', 'UPDATE'] },
  { module: '系统设置', prefix: 'SYS', objectName: '系统配置', operations: ['UPDATE', 'CONFIRM'] },
];

const pad = (value: number, length = 4) => String(value).padStart(length, '0');

const makeObjectNo = (prefix: string, index: number) => {
  if (prefix === 'FL') return `FL202607${pad((index % 6) + 1, 2)}-${pad(index + 1, 8)}`;
  if (prefix === 'SKU') return `SKU${pad((index % 18) + 1, 3)}`;
  if (prefix === 'CUST') return `CUST${pad((index % 12) + 1, 3)}`;
  if (prefix === 'VEND') return `VEND${pad((index % 10) + 1, 3)}`;
  if (prefix === 'WH') return `WH${pad((index % 8) + 1, 3)}`;
  if (prefix === 'STK') return `STK-WH${pad((index % 5) + 1, 3)}-SKU${pad((index % 15) + 1, 3)}`;
  if (prefix === 'SYS') return `SYS-CONFIG-${pad((index % 6) + 1, 2)}`;
  return `${prefix}202607${pad((index % 6) + 1, 2)}-${pad((index % 12) + 1, 4)}`;
};

export function createAuditLogMock(count = 42): AuditLogRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const target = auditTargets[index % auditTargets.length];
    const operationType = target.operations[index % target.operations.length];
    const operator = operators[index % operators.length];
    const objectNo = makeObjectNo(target.prefix, index);
    const day = 6 - (index % 6);
    const hour = 18 - (index % 10);
    const minute = (index * 7) % 60;
    const second = (index * 13) % 60;
    const timestamp = `2026-07-${pad(day, 2)} ${pad(hour, 2)}:${pad(minute, 2)}:${pad(second, 2)}`;
    const action = AUDIT_OPERATION_LABELS[operationType];

    return {
      id: `AUDIT-${pad(index + 1, 5)}`,
      timestamp,
      operator,
      module: target.module,
      operationType,
      objectNo,
      detail: `${operator} 对 ${target.objectName} ${objectNo} 执行了${action}操作`,
    };
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

const initialLogs = createAuditLogMock();

export const auditModules = Array.from(new Set(initialLogs.map(log => log.module)));

export const auditApi = {
  getLogs(query: AuditLogQuery = {}, source: AuditLogRecord[] = initialLogs): AuditLogRecord[] {
    const keyword = query.keyword?.trim().toLowerCase() || '';
    const operator = query.operator?.trim().toLowerCase() || '';

    return source
      .filter(log => {
        const logDate = log.timestamp.slice(0, 10);
        if (operator && !log.operator.toLowerCase().includes(operator)) return false;
        if (query.operationType && log.operationType !== query.operationType) return false;
        if (query.module && log.module !== query.module) return false;
        if (query.dateStart && logDate < query.dateStart) return false;
        if (query.dateEnd && logDate > query.dateEnd) return false;
        if (keyword) {
          const haystack = `${log.operator} ${log.module} ${AUDIT_OPERATION_LABELS[log.operationType]} ${log.objectNo} ${log.detail}`.toLowerCase();
          if (!haystack.includes(keyword)) return false;
        }
        return true;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  clearMockLogs(): AuditLogRecord[] {
    return [];
  },
};
