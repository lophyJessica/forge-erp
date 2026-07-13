import React from 'react';
import { baseDataApi } from '../api/baseData';
import { 
  User, Shield, Clipboard, Server, Calendar, Info
} from 'lucide-react';

export default function Settings() {
  const logs = baseDataApi.getSystemLogs();

  return (
    <div className="space-y-6 pb-12 text-xs">
      
      {/* 账号管理 + 关于系统（并排） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 账号管理 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <User size={16} className="text-primary" />
            账号管理
          </h3>
          <div className="space-y-3 text-slate-600">
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-400">用户名</span>
              <span className="font-bold text-slate-800">系统管理员 (admin)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-400">绑定邮箱</span>
              <span className="font-medium">admin@qiangsheng.com</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-400">系统角色</span>
              <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold">
                超级管理员
              </span>
            </div>
            <div className="flex justify-between items-start py-1">
              <span className="font-semibold text-slate-400">所属部门</span>
              <span className="font-medium">总经理办公室 / 信息技术部</span>
            </div>
          </div>
        </div>

        {/* 关于产品 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <Info size={16} className="text-primary" />
            关于强盛进销存
          </h3>
          <div className="space-y-3 text-slate-600">
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-400">系统名称</span>
              <span className="font-bold text-slate-800">强盛智能进销存管理系统</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-400">原型版本</span>
              <span className="font-mono font-bold text-emerald-600">v1.2.0-Prototype</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-400">技术选型</span>
              <span className="font-medium text-slate-700">React + Vite + Tailwind CSS</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-semibold text-slate-400">系统状态</span>
              <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                演示环境已就绪
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 单据编号规则卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <Clipboard size={16} className="text-primary" />
          单据编码规则规则明细
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-40">单据模块</th>
                <th className="p-3 w-32">单据前缀</th>
                <th className="p-3 w-48">流水号机制</th>
                <th className="p-3">单号生成示例</th>
                <th className="p-3 w-28 text-center">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              <tr className="hover:bg-slate-50/20">
                <td className="p-3">采购订单 (PO)</td>
                <td className="p-3 font-mono text-primary font-bold">PO</td>
                <td className="p-3 text-slate-500 font-medium">8位年月日 + 4位顺序流水</td>
                <td className="p-3 font-mono text-slate-600">PO20260704-0001</td>
                <td className="p-3 text-center">
                  <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">已启用</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/20">
                <td className="p-3">采购入库单 (PI)</td>
                <td className="p-3 font-mono text-primary font-bold">PI</td>
                <td className="p-3 text-slate-500 font-medium">8位年月日 + 4位顺序流水</td>
                <td className="p-3 font-mono text-slate-600">PI20260704-0001</td>
                <td className="p-3 text-center">
                  <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">已启用</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/20">
                <td className="p-3">采购退货单 (PR)</td>
                <td className="p-3 font-mono text-primary font-bold">PR</td>
                <td className="p-3 text-slate-500 font-medium">8位年月日 + 4位顺序流水</td>
                <td className="p-3 font-mono text-slate-600">PR20260705-0001</td>
                <td className="p-3 text-center">
                  <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">已启用</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/20">
                <td className="p-3">采购退货出库单 (PRO)</td>
                <td className="p-3 font-mono text-primary font-bold">PRO</td>
                <td className="p-3 text-slate-500 font-medium">8位年月日 + 4位顺序流水</td>
                <td className="p-3 font-mono text-slate-600">PRO20260705-0001</td>
                <td className="p-3 text-center">
                  <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">已启用</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/20">
                <td className="p-3">库存流水台账 (FL)</td>
                <td className="p-3 font-mono text-primary font-bold">FL</td>
                <td className="p-3 text-slate-500 font-medium">8位年月日 + 8位顺序流水</td>
                <td className="p-3 font-mono text-slate-600">FL20260705-00000001</td>
                <td className="p-3 text-center">
                  <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">已启用</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 操作日志 (只读 10 条) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <Server size={16} className="text-primary" />
          系统审计操作日志 (只读 10 条)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-3 w-40">发生时间</th>
                <th className="p-3 w-32">操作账户</th>
                <th className="p-3 w-32">审计模块</th>
                <th className="p-3">审计操作描述</th>
                <th className="p-3 w-28 text-center">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/20">
                  <td className="p-3 font-mono text-slate-400 font-medium">{log.timestamp}</td>
                  <td className="p-3 font-bold text-slate-700">{log.operator}</td>
                  <td className="p-3">
                    <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{log.action}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold">
                      成功
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
