import Dexie, { type Table } from 'dexie';
import { purchaseOrderApi } from './purchaseOrder';
import { readTable, replaceTable } from '../db';
import type { PurchaseOrder } from '../types/purchaseOrder';
import type { PurchaseOrderSync, PurchaseOrderSyncStatus } from '../types/integration';

class IntegrationDb extends Dexie {
  integration_outbox!: Table<PurchaseOrderSync, string>;
  integration_inbox!: Table<PurchaseOrderSync, string>;

  constructor() {
    super('qs_erp_wms_integration_db');
    this.version(1).stores({
      integration_outbox: 'poId, status, syncTime',
      integration_inbox: 'poId, status, syncTime',
    });
  }
}

export const integrationDb = new IntegrationDb();

function now() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function buildSync(order: PurchaseOrder, status: PurchaseOrderSyncStatus): PurchaseOrderSync {
  return {
    poId: order.id,
    supplier: {
      code: order.supplierCode,
      name: order.supplierName,
    },
    warehouse: {
      code: order.warehouseCode,
      name: order.warehouseName,
    },
    items: order.items.map(item => ({
      id: item.id,
      productCode: item.productCode,
      productName: item.productName,
      productBarcode: item.productBarcode,
      productSpec: item.productSpec,
      unit: item.unit,
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity || 0,
      pendingQuantity: item.pendingQuantity,
    })),
    status,
    syncTime: now(),
    sourceSystem: 'ERP',
    targetSystem: 'WMS',
  };
}

export const integrationApi = {
  async dispatchPurchaseOrder(poId: string): Promise<PurchaseOrderSync> {
    const order = purchaseOrderApi.getOrderById(poId);
    if (!order) throw new Error('采购订单不存在');
    if (!['PENDING_STOCK_IN', 'PARTIAL_STOCK_IN'].includes(order.status)) {
      throw new Error('只有审核通过且待入库的采购订单可以下发 WMS');
    }

    const sync = buildSync(order, 'DISPATCHED');
    await integrationDb.integration_outbox.put(sync);
    return sync;
  },

  async getPurchaseOrderWmsStatus(poId: string): Promise<PurchaseOrderSyncStatus> {
    const inbox = await integrationDb.integration_inbox.get(poId);
    if (inbox) return inbox.status;

    const outbox = await integrationDb.integration_outbox.get(poId);
    return outbox ? 'DISPATCHED' : 'PENDING_DISPATCH';
  },

  async applyWmsInboundFeedback(): Promise<void> {
    purchaseOrderApi.getOrders({});
    const inboxRows = await integrationDb.integration_inbox.toArray();
    const feedbackRows = inboxRows.filter(row => row.status === 'PARTIAL_RECEIVED' || row.status === 'FULL_RECEIVED');
    if (feedbackRows.length === 0) return;

    const orders = readTable<PurchaseOrder>('purchaseOrders', []);
    let changed = false;

    for (const feedback of feedbackRows) {
      const index = orders.findIndex(order => order.id === feedback.poId);
      if (index === -1) continue;

      const order = orders[index];
      if (order.status === 'VOIDED' || order.status === 'DRAFT' || order.status === 'PENDING_AUDIT') continue;

      const updatedItems = order.items.map(item => {
        const syncItem = feedback.items.find(sync => sync.id === item.id || sync.productCode === item.productCode);
        if (!syncItem) return item;
        const receivedQuantity = Math.min(item.quantity, syncItem.receivedQuantity || 0);
        return {
          ...item,
          receivedQuantity,
          pendingQuantity: Math.max(0, item.quantity - receivedQuantity),
        };
      });

      const hasAnyReceived = updatedItems.some(item => item.receivedQuantity > 0);
      const allCompleted = updatedItems.every(item => item.pendingQuantity === 0);
      const nextStatus = allCompleted ? 'COMPLETED' : hasAnyReceived ? 'PARTIAL_STOCK_IN' : order.status;

      orders[index] = {
        ...order,
        items: updatedItems,
        status: nextStatus,
        updatedAt: feedback.syncTime,
        updatedBy: 'WMS回传',
      };
      changed = true;
    }

    if (changed) {
      replaceTable('purchaseOrders', orders);
    }
  },
};
