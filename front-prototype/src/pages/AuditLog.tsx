import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RotateCcw, Search, Trash2 } from 'lucide-react';
import { auditApi, auditModules, createAuditLogMock } from '../api/audit';
import { AUDIT_OPERATION_LABELS, AuditLogRecord, AuditOperationType } from '../types/audit';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import PageTitle from '../components/shared/PageTitle';
import Pagination from '../components/shared/Pagination';

const operationTone: Record<AuditOperationType, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  UPDATE: 'bg-sky-50 text-sky-700 border-sky-100',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-100',
  APPROVE: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  VOID: 'bg-amber-50 text-amber-700 border-amber-100',
  CONFIRM: 'bg-primary/10 text-primary border-primary/20',
};

export default function AuditLog() {
  const [sourceLogs, setSourceLogs] = useState<AuditLogRecord[]>(() => createAuditLogMock());
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [operator, setOperator] = useState('');
  const [operationType, setOperationType] = useState<AuditOperationType | ''>('');
  const [module, setModule] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const dateError = useMemo(() => {
    if (dateStart && dateEnd && dateEnd < dateStart) return '结束日期不能早于开始日期';
    return '';
  }, [dateStart, dateEnd]);

  const loadData = () => {
    if (dateError) return;
    const res = auditApi.getLogs({
      operator,
      operationType,
      module,
      dateStart,
      dateEnd,
      keyword,
    }, sourceLogs);
    setLogs(res);
  };

  useEffect(() => {
    loadData();
  }, [sourceLogs, operationType, module, dateStart, dateEnd, dateError]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleReset = () => {
    setOperator('');
    setOperationType('');
    setModule('');
    setDateStart('');
    setDateEnd('');
    setKeyword('');
    setCurrentPage(1);
  };

  const handleClearMock = () => {
    setSourceLogs(auditApi.clearMockLogs());
    setCurrentPage(1);
    setShowClearConfirm(false);
  };

  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <PageTitle compact title="操作日志" description="系统关键操作只读台账，默认按操作时间倒序展示。" />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">操作人</label>
              <Input
                value={operator}
                onChange={event => setOperator(event.target.value)}
                placeholder="输入账号或姓名"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">操作类型</label>
              <select
                value={operationType}
                onChange={event => setOperationType(event.target.value as AuditOperationType | '')}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部类型</option>
                {Object.entries(AUDIT_OPERATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">模块</label>
              <select
                value={module}
                onChange={event => setModule(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">全部模块</option>
                {auditModules.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="font-semibold text-slate-500 block">日期范围</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateStart}
                  onChange={event => setDateStart(event.target.value)}
                  className={`rounded-md border ${dateError ? 'border-rose-500 bg-rose-50/10' : 'border-input'} bg-background px-2 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1 min-w-0`}
                />
                <span className="text-slate-400 font-bold">至</span>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={event => setDateEnd(event.target.value)}
                  className={`rounded-md border ${dateError ? 'border-rose-500 bg-rose-50/10' : 'border-input'} bg-background px-2 h-9 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/50 flex-1 min-w-0`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">关键词</label>
              <Input
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                placeholder="单号/详情关键词"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {dateError && (
            <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold bg-rose-50 border border-rose-100 rounded-md p-2.5">
              <AlertTriangle size={14} />
              <span>{dateError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-9 px-4 text-xs flex items-center gap-1.5 font-bold"
            >
              <RotateCcw size={14} />
              重置
            </Button>
            <Button
              type="submit"
              disabled={!!dateError}
              className="h-9 px-4 text-xs flex items-center gap-1.5 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Search size={14} />
              搜索
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-bold">操作日志明细</span>
          <Button
            variant="destructive"
            size="sm"
            disabled={sourceLogs.length === 0}
            onClick={() => setShowClearConfirm(true)}
            className="h-8 py-1.5 text-xs flex items-center gap-1 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} />
            全部删除
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1120px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-44">时间</th>
                <th className="p-3 w-32">操作人</th>
                <th className="p-3 w-32">模块</th>
                <th className="p-3 w-28 text-center">操作类型</th>
                <th className="p-3 w-48">对象(单号)</th>
                <th className="p-3">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-3 font-mono text-slate-500 font-medium">{log.timestamp}</td>
                    <td className="p-3 font-bold text-slate-800">{log.operator}</td>
                    <td className="p-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] border font-bold ${operationTone[log.operationType]}`}>
                        {AUDIT_OPERATION_LABELS[log.operationType]}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-primary">{log.objectNo}</td>
                    <td className="p-3 font-semibold text-slate-700">{log.detail}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium bg-white">
                    暂无操作日志
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={logs.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={nextPageSize => {
          setPageSize(nextPageSize);
          setCurrentPage(1);
        }}
      />

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-800">确认全部删除</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                本操作仅清空当前演示页的操作日志 Mock 数据，不影响任何业务单据或系统配置。
              </p>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                取消
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearMock} className="font-semibold">
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
