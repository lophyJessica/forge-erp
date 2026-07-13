import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  PurchaseOrder, 
  PurchaseOrderStatus,
  StockInRecord
} from '../types/purchaseOrder';
import { 
  purchaseOrderApi,
  MOCK_SUPPLIERS,
  MOCK_WAREHOUSES
} from '../api/purchaseOrder';
import { stockInApi } from '../api/stockIn';
import { integrationApi } from '../api/integration';
import WmsStatusTag from '../components/WmsStatusTag';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  ArrowLeft, CheckCircle, XCircle, FileText, Trash2, Edit3, 
  Send, ShieldCheck, Ban, ArrowUpRight, Clipboard, Clock
} from 'lucide-react';

export default function PurchaseOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // --- 状态定义 ---
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [stockInRecords, setStockInRecords] = useState<any[]>([]);

  // 弹窗控制
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CLOSE' | null;
    title: string;
    msg: string;
  }>({ type: null, title: '', msg: '' });

  // 作废弹窗
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');



  // --- 数据加载 ---
  const loadData = async () => {
    if (!id) return;
    await integrationApi.applyWmsInboundFeedback();
    const res = purchaseOrderApi.getOrderById(id);
    if (res) {
      setOrder(res);
      const records = stockInApi.getStockInsByPO(id);
      setStockInRecords(records);
    } else {
      alert('单据不存在');
      navigate('/purchase/orders');
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);



  if (!order) return <div className="p-8 text-center text-slate-400">加载中...</div>;

  // --- 状态 Badge 颜色配置 ---
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const config: Record<PurchaseOrderStatus, { label: string; classes: string }> = {
      DRAFT: { label: '草稿', classes: 'bg-zinc-100 text-zinc-800 border border-zinc-200' },
      PENDING_AUDIT: { label: '待审核', classes: 'bg-orange-50 text-orange-700 border border-orange-200' },
      PENDING_STOCK_IN: { label: '待入库', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
      PARTIAL_STOCK_IN: { label: '部分入库', classes: 'bg-sky-50 text-sky-700 border border-sky-200' },
      COMPLETED: { label: '已完成', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      VOIDED: { label: '已作废', classes: 'bg-rose-50 text-rose-700 border border-rose-200' }
    };
    const item = config[status] || { label: status, classes: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${item.classes}`}>
        {item.label}
      </span>
    );
  };

  // --- 状态流转操作 ---
  const handleAction = (actionType: typeof confirmAction['type']) => {
    if (!order) return;
    try {
      switch (actionType) {
        case 'DELETE':
          purchaseOrderApi.deleteOrder(order.id);
          alert('采购订单已删除');
          navigate('/purchase/orders');
          break;
        case 'SUBMIT':
          purchaseOrderApi.submitOrder(order.id);
          alert('已成功提交审核');
          break;
        case 'APPROVE':
          purchaseOrderApi.approveOrder(order.id);
          alert('订单审核已通过');
          break;
        case 'REJECT':
          purchaseOrderApi.rejectOrder(order.id);
          alert('订单已驳回至草稿态');
          break;
        case 'CLOSE':
          purchaseOrderApi.closeOrder(order.id);
          alert('订单已人工强行关闭完结');
          break;
      }
      setConfirmAction({ type: null, title: '', msg: '' });
      void loadData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleVoidOrder = () => {
    if (!voidReason.trim()) return;
    try {
      purchaseOrderApi.voidOrder(order.id, voidReason);
      setIsVoidModalOpen(false);
      alert('订单已作废');
      void loadData();
    } catch (err: any) {
      alert(err.message || '作废失败');
    }
  };

  const handleDispatchWms = async () => {
    try {
      await integrationApi.dispatchPurchaseOrder(order.id);
      alert('采购订单已下发至WMS');
      await loadData();
    } catch (err: any) {
      alert(err.message || '下发WMS失败');
    }
  };



  // --- 时间线计算 ---
  const getTimelineSteps = () => {
    const steps = [
      { label: '创建草稿', active: true, time: order.createdAt, user: order.createdBy },
      { label: '提交审核', active: order.status !== 'DRAFT', time: order.status !== 'DRAFT' ? order.updatedAt : null, user: order.status !== 'DRAFT' ? order.updatedBy : null },
      { label: '审核通过', active: !['DRAFT', 'PENDING_AUDIT', 'VOIDED'].includes(order.status) || (order.status === 'VOIDED' && order.approvedBy), time: order.approvedAt, user: order.approvedBy },
      { label: '入库执行', active: ['PARTIAL_STOCK_IN', 'COMPLETED'].includes(order.status), time: stockInRecords[0]?.stockInDate, user: stockInRecords[0]?.operator },
      { label: '订单完成', active: order.status === 'COMPLETED', time: order.status === 'COMPLETED' ? order.updatedAt : null, user: order.status === 'COMPLETED' ? order.updatedBy : null }
    ];

    if (order.status === 'VOIDED') {
      steps.splice(order.approvedBy ? 3 : 2, 0, {
        label: '单据已作废',
        active: true,
        time: order.updatedAt || '',
        user: order.updatedBy || ''
      });
    }
    return steps;
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 页头标题 + 动态按钮 */}
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchase/orders')} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800">采购订单 {order.id}</h1>
              {getStatusBadge(order.status)}
              <WmsStatusTag poId={order.id} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              供应商：<span className="font-semibold text-slate-700">{order.supplierName}</span> | 仓库：<span className="font-semibold text-slate-700">{order.warehouseName}</span>
            </p>
          </div>
        </div>

        {/* 页头操作按钮组：基于单据当前状态动态呈现，满足动作能力矩阵 */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Button variant="outline" size="sm" onClick={() => navigate('/purchase/orders')} className="h-8 py-1">
            返回列表
          </Button>

          {/* 草稿状态操作 */}
          {order.status === 'DRAFT' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/purchase/orders/${order.id}/edit`)} 
                className="h-8 py-1 flex items-center gap-1"
              >
                <Edit3 size={13} />
                编辑
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({ 
                  type: 'SUBMIT', 
                  title: '确认提交审核', 
                  msg: '提交审核后，单据的关键字段（供应商、仓库、商品等）将被锁死并由管理人员进行审核审批，是否确认提交？' 
                })} 
                className="h-8 py-1 flex items-center gap-1 text-blue-600 hover:text-blue-700 border-blue-200"
              >
                <Send size={13} />
                提交审核
              </Button>

              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setConfirmAction({ 
                  type: 'DELETE', 
                  title: '确认删除', 
                  msg: '删除后不可恢复，该采购订单将从系统中永久移除，确认删除？' 
                })} 
                className="h-8 py-1 flex items-center gap-1"
              >
                <Trash2 size={13} />
                删除
              </Button>
            </>
          )}

          {/* 待审核状态操作 */}
          {order.status === 'PENDING_AUDIT' && (
            <>
              <Button 
                size="sm" 
                onClick={() => setConfirmAction({ 
                  type: 'APPROVE', 
                  title: '采购订单审核通过', 
                  msg: '审核通过后，该订单即作为后续到货接收的正式原始单据凭证。确认审核通过吗？' 
                })} 
                className="h-8 py-1 flex items-center gap-1"
              >
                <ShieldCheck size={13} />
                审核通过
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({ 
                  type: 'REJECT', 
                  title: '确认驳回订单', 
                  msg: '驳回后，订单将退回至“草稿”状态，可重新进行编辑，确认驳回吗？' 
                })} 
                className="h-8 py-1 flex items-center gap-1 text-amber-600 hover:text-amber-700 border-amber-200"
              >
                <Ban size={13} />
                驳回
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setVoidReason('');
                  setIsVoidModalOpen(true);
                }} 
                className="h-8 py-1 flex items-center gap-1 text-rose-600 hover:text-rose-700 border-rose-200"
              >
                <XCircle size={13} />
                作废订单
              </Button>
            </>
          )}

          {/* 待入库状态操作 */}
          {order.status === 'PENDING_STOCK_IN' && (
            <>
              <Button 
                size="sm" 
                onClick={() => navigate(`/purchase/receipts/new?source_id=${order.id}`)}
                className="h-8 py-1 flex items-center gap-1"
              >
                <ArrowUpRight size={13} />
                创建入库单
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setVoidReason('');
                  setIsVoidModalOpen(true);
                }} 
                className="h-8 py-1 flex items-center gap-1 text-rose-600 hover:text-rose-700 border-rose-200"
              >
                <XCircle size={13} />
                作废订单
              </Button>
            </>
          )}

          {/* 部分入库状态操作 */}
          {order.status === 'PARTIAL_STOCK_IN' && (
            <>
              <Button 
                size="sm" 
                onClick={() => navigate(`/purchase/receipts/new?source_id=${order.id}`)}
                className="h-8 py-1 flex items-center gap-1"
              >
                <ArrowUpRight size={13} />
                创建入库单
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmAction({ 
                  type: 'CLOSE', 
                  title: '订单缺量完结 (人工关闭)', 
                  msg: '当供应商无法补足尾货时，可人工关闭此订单。关闭后剩余未入库的商品将不再被接收，订单置为“已完成”。是否确认关闭？' 
                })} 
                className="h-8 py-1 flex items-center gap-1 text-rose-600 hover:text-rose-700 border-rose-200"
              >
                <XCircle size={13} />
                关闭订单
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 作废原因特殊展示（如果已作废） */}
      {order.status === 'VOIDED' && (
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 text-xs text-rose-700 space-y-1">
          <div className="font-bold flex items-center gap-1">
            <XCircle size={15} />
            订单已作废
          </div>
          <p><strong>作废说明：</strong> {order.voidReason || '未填写'}</p>
        </div>
      )}

      {/* 状态时间线 (Timeline) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1">
          <Clock size={16} />
          单据状态流转图
        </h3>
        
        <div className="flex items-center justify-between overflow-x-auto py-2 text-xs">
          {getTimelineSteps().map((step, idx, arr) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center text-center space-y-1 min-w-[120px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${
                  step.active 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <div className={`font-semibold ${step.active ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</div>
                {step.time && (
                  <div className="text-[10px] text-slate-400">
                    <p>{step.time.split(' ')[0]}</p>
                    <p className="font-medium">[{step.user || 'Admin'}]</p>
                  </div>
                )}
              </div>
              {idx < arr.length - 1 && (
                <div className={`flex-1 h-0.5 min-w-[30px] ${step.active && arr[idx+1].active ? 'bg-primary' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 基本信息卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1">
          <FileText size={16} />
          基本信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-400 block mb-1">采购单号</span>
            <span className="font-bold text-slate-800">{order.id}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">供应商</span>
            <span className="font-semibold text-slate-800">
              <span className="text-slate-400 font-normal">[{order.supplierCode}]</span> {order.supplierName}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">入库仓库</span>
            <span className="font-semibold text-slate-800">
              <span className="text-slate-400 font-normal">[{order.warehouseCode}]</span> {order.warehouseName}
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">下单日期</span>
            <span className="font-semibold text-slate-800">{order.orderDate}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">预计到货日期</span>
            <span className="font-semibold text-slate-800">{order.expectedDeliveryDate || '-'}</span>
          </div>
          <div className="md:col-span-3">
            <span className="font-semibold text-slate-400 block mb-1">采购备注</span>
            <span className="font-semibold text-slate-800 break-words">{order.remark || '-'}</span>
          </div>
        </div>
      </div>

      {/* 商品明细卡片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
            <Clipboard size={16} />
            商品明细
          </h3>
          <span className="text-xs text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded">
            共 {order.itemCount} 种商品 | 总数量 {order.totalQuantity} 件 | 总金额 ¥{order.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                <th className="p-3 w-12 text-center">序号</th>
                <th className="p-3 w-28">商品编码</th>
                <th className="p-3">商品名称</th>
                <th className="p-3 w-32">商品条码</th>
                <th className="p-3 w-28">规格</th>
                <th className="p-3 w-16">单位</th>
                <th className="p-3 text-right w-24">采购数量</th>
                <th className="p-3 text-right w-28">单价 (含税)</th>
                <th className="p-3 w-16">税率</th>
                <th className="p-3 text-right w-28">金额 (含税)</th>
                
                {/* 草稿/待审核/已作废 不展示累计已入库和未入库数量 */}
                {!['DRAFT', 'PENDING_AUDIT', 'VOIDED'].includes(order.status) && (
                  <th className="p-3 text-right w-28 text-emerald-600">累计已入库</th>
                )}
                {/* 待入库/部分入库 展示未入库列；已完成隐藏未入库（已归零） */}
                {['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status) && (
                  <th className="p-3 text-right w-24 text-amber-600">未入库</th>
                )}
                
                <th className="p-3">行备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {order.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/20">
                  <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-semibold">{item.productCode}</td>
                  <td className="p-3 max-w-[180px] truncate">{item.productName}</td>
                  <td className="p-3 text-slate-500">{item.productBarcode || '-'}</td>
                  <td className="p-3 text-slate-500">{item.productSpec || '-'}</td>
                  <td className="p-3 text-slate-500">{item.unit || '-'}</td>
                  <td className="p-3 text-right font-semibold">{item.quantity}</td>
                  <td className="p-3 text-right font-semibold">¥{item.price.toFixed(2)}</td>
                  <td className="p-3">{item.taxRate || '-'}</td>
                  <td className="p-3 text-right font-bold text-slate-800">
                    ¥{item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* 显隐列判定 */}
                  {!['DRAFT', 'PENDING_AUDIT', 'VOIDED'].includes(order.status) && (
                    <td className="p-3 text-right font-bold text-emerald-600">{item.receivedQuantity}</td>
                  )}
                  {['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status) && (
                    <td className="p-3 text-right font-bold text-amber-600">{item.pendingQuantity}</td>
                  )}

                  <td className="p-3 text-slate-500 max-w-[120px] truncate">{item.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end bg-slate-50 p-3 rounded-md text-xs font-bold text-slate-700 border border-slate-100">
          <div className="flex gap-8">
            <div>商品种数：<span className="text-primary">{order.itemCount} 种</span></div>
            <div>总采购数量：<span className="text-primary">{order.totalQuantity} 件</span></div>
            <div>含税总金额：<span className="text-primary text-sm font-extrabold">¥{order.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          </div>
        </div>
      </div>

      {/* 关联入库单卡片 (只对待入库/部分入库/已完成展示) */}
      {!['DRAFT', 'PENDING_AUDIT', 'VOIDED'].includes(order.status) && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-1">
            <ArrowUpRight size={16} className="text-emerald-500" />
            关联采购入库单
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-semibold">
                  <th className="p-3 w-40">入库单号</th>
                  <th className="p-3 w-36">入库日期</th>
                  <th className="p-3 text-right w-36">本次入库数量</th>
                  <th className="p-3">收货操作人</th>
                  <th className="p-3 text-center w-28">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {stockInRecords.length > 0 ? (
                  stockInRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/20">
                      <td className="p-3 font-semibold text-emerald-600 hover:underline cursor-pointer" onClick={() => navigate(`/purchase/receipts/${rec.id}`)}>{rec.id}</td>
                      <td className="p-3 text-slate-600">{rec.stockInDate}</td>
                      <td className="p-3 text-right font-bold">{rec.totalQuantity} 件</td>
                      <td className="p-3">{rec.createdBy}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rec.status === 'DRAFT' ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                          rec.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {rec.status === 'DRAFT' ? '草稿' : rec.status === 'CONFIRMED' ? '已确认' : '已作废'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      尚未进行到货入库。请点击页头“创建入库单”按钮开始收货。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 制单信息卡片 (固定置底) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 pb-2 border-b border-slate-100">制单信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-400 block mb-1">创建人</span>
            <span className="font-bold text-slate-800">{order.createdBy}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">创建时间</span>
            <span className="font-semibold text-slate-800">{order.createdAt}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">最后修改人</span>
            <span className="font-semibold text-slate-800">{order.updatedBy || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">最后修改时间</span>
            <span className="font-semibold text-slate-800">{order.updatedAt || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">审核人</span>
            <span className="font-semibold text-slate-800">{order.approvedBy || '-'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block mb-1">审核时间</span>
            <span className="font-semibold text-slate-800">{order.approvedAt || '-'}</span>
          </div>
        </div>
      </div>

      {/* 二次确认弹窗 */}
      {confirmAction.type !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-800">{confirmAction.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{confirmAction.msg}</p>
            </div>
            
            <div className="flex justify-end gap-2 text-xs pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction({ type: null, title: '', msg: '' })}>
                取消
              </Button>
              <Button 
                variant={confirmAction.type === 'DELETE' || confirmAction.type === 'REJECT' ? 'destructive' : 'default'}
                size="sm" 
                onClick={() => handleAction(confirmAction.type)}
                className="font-semibold"
              >
                {confirmAction.type === 'DELETE' ? '确认删除' :
                 confirmAction.type === 'SUBMIT' ? '确认提交' :
                 confirmAction.type === 'APPROVE' ? '确认审核' :
                 confirmAction.type === 'REJECT' ? '确认驳回' :
                 confirmAction.type === 'CLOSE' ? '确认关闭' : '确认作废'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 作废录入原因弹窗 */}
      {isVoidModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-800">作废采购订单</h3>
              <p className="text-xs text-rose-500 mt-1 font-semibold">⚠️ 警告：作废是不可逆操作，单据将永久变为已作废状态且无法入库。</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">作废原因 <span className="text-rose-500">*</span></label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="请输入订单作废的原因..."
                rows={3}
                className="w-full text-xs p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsVoidModalOpen(false)}>
                取消
              </Button>
              <Button 
                variant="destructive"
                size="sm" 
                onClick={handleVoidOrder}
                disabled={!voidReason.trim()}
                className="font-semibold"
              >
                确认作废
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
