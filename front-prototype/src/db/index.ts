import Dexie, { type Table } from 'dexie';
import type { PurchaseOrder, StockInRecord } from '../types/purchaseOrder';
import type { StockIn, InventoryFlow, InstantStock } from '../types/stockIn';
import type { PurchaseReturn } from '../types/purchaseReturn';
import type { PurchaseReturnOutbound } from '../types/purchaseReturnOutbound';
import type { SalesOrder, SalesOutbound, SalesReturn } from '../types/sales';
import type { RetailOrder, RetailReturn } from '../types/retail';
import type { BaseSupplier, BaseCustomer, BaseProduct, BaseWarehouse } from '../types/baseData';
import type { PaymentRecord, ReceiptRecord } from '../types/finance';
import type { RfqOrder } from '../types/rfq';

export interface AccountPayable {
  id: string;
  stockInId: string;
  sourceNo?: string;
  supplierCode?: string;
  supplierName: string;
  amount: number;
  status: string;
  createdAt: string;
  sourceDate?: string;
}

export interface AccountReceivable {
  id: string;
  salesOutboundId?: string;
  retailOrderId?: string;
  sourceNo?: string;
  customerCode?: string;
  customerName: string;
  amount: number;
  status: string;
  createdAt: string;
  sourceDate?: string;
}

type WithId<T> = T & { id: string };

export class QsInventoryDb extends Dexie {
  purchaseOrders!: Table<PurchaseOrder, string>;
  stockInRecords!: Table<StockIn, string>;
  purchaseOrderStockInRecords!: Table<StockInRecord, string>;
  purchaseReturns!: Table<PurchaseReturn, string>;
  returnOutbounds!: Table<PurchaseReturnOutbound, string>;
  salesOrders!: Table<SalesOrder, string>;
  salesOutbounds!: Table<SalesOutbound, string>;
  salesReturns!: Table<SalesReturn, string>;
  retailOrders!: Table<RetailOrder, string>;
  retailReturns!: Table<RetailReturn, string>;
  suppliers!: Table<WithId<BaseSupplier>, string>;
  customers!: Table<WithId<BaseCustomer>, string>;
  products!: Table<WithId<BaseProduct>, string>;
  warehouses!: Table<WithId<BaseWarehouse>, string>;
  inventoryFlows!: Table<InventoryFlow, string>;
  instantStocks!: Table<InstantStock, string>;
  accountsPayable!: Table<AccountPayable, string>;
  accountsReceivable!: Table<AccountReceivable, string>;
  receiptRecords!: Table<ReceiptRecord, string>;
  paymentRecords!: Table<PaymentRecord, string>;
  rfqs!: Table<RfqOrder, string>;

  constructor() {
    super('qs_inventory_db');

    this.version(1).stores({
      purchaseOrders: 'id',
      stockInRecords: 'id,purchaseOrderId,status,stockInDate',
      purchaseOrderStockInRecords: 'id,purchaseOrderId',
      purchaseReturns: 'id,sourceStockInId,status,returnDate',
      returnOutbounds: 'id,sourceReturnId,status,outboundDate',
      suppliers: 'id,code,status',
      customers: 'id,code,status',
      products: 'id,code,status',
      warehouses: 'id,code,status',
      inventoryFlows: 'id,sourceId,warehouseCode,productCode,changeType,createdAt',
      instantStocks: 'id,warehouseCode,productCode,batchNo',
      accountsPayable: 'id,stockInId,status,createdAt'
    });

    this.version(2).stores({
      purchaseOrders: 'id',
      stockInRecords: 'id,purchaseOrderId,status,stockInDate',
      purchaseOrderStockInRecords: 'id,purchaseOrderId',
      purchaseReturns: 'id,sourceStockInId,status,returnDate',
      returnOutbounds: 'id,sourceReturnId,status,outboundDate',
      salesOrders: 'id,status,customerCode,orderDate',
      salesOutbounds: 'id,salesOrderId,status,outboundDate',
      suppliers: 'id,code,status',
      customers: 'id,code,status',
      products: 'id,code,status',
      warehouses: 'id,code,status',
      inventoryFlows: 'id,sourceId,warehouseCode,productCode,changeType,createdAt',
      instantStocks: 'id,warehouseCode,productCode,batchNo',
      accountsPayable: 'id,stockInId,status,createdAt',
      accountsReceivable: 'id,salesOutboundId,status,createdAt'
    });

    this.version(3).stores({
      purchaseOrders: 'id',
      stockInRecords: 'id,purchaseOrderId,status,stockInDate',
      purchaseOrderStockInRecords: 'id,purchaseOrderId',
      purchaseReturns: 'id,sourceStockInId,status,returnDate',
      returnOutbounds: 'id,sourceReturnId,status,outboundDate',
      salesOrders: 'id,status,customerCode,orderDate',
      salesOutbounds: 'id,salesOrderId,status,outboundDate',
      retailOrders: 'id,cashierName,paymentMethod,checkoutAt',
      suppliers: 'id,code,status',
      customers: 'id,code,status',
      products: 'id,code,status',
      warehouses: 'id,code,status',
      inventoryFlows: 'id,sourceId,warehouseCode,productCode,changeType,createdAt',
      instantStocks: 'id,warehouseCode,productCode,batchNo',
      accountsPayable: 'id,stockInId,status,createdAt',
      accountsReceivable: 'id,salesOutboundId,retailOrderId,status,createdAt'
    });

    this.version(4).stores({
      purchaseOrders: 'id',
      stockInRecords: 'id,purchaseOrderId,status,stockInDate',
      purchaseOrderStockInRecords: 'id,purchaseOrderId',
      purchaseReturns: 'id,sourceStockInId,status,returnDate',
      returnOutbounds: 'id,sourceReturnId,status,outboundDate',
      salesOrders: 'id,status,customerCode,orderDate',
      salesOutbounds: 'id,salesOrderId,status,outboundDate',
      retailOrders: 'id,cashierName,paymentMethod,checkoutAt',
      suppliers: 'id,code,status',
      customers: 'id,code,status',
      products: 'id,code,status',
      warehouses: 'id,code,status',
      inventoryFlows: 'id,sourceId,warehouseCode,productCode,changeType,createdAt',
      instantStocks: 'id,warehouseCode,productCode,batchNo',
      accountsPayable: 'id,stockInId,sourceNo,supplierCode,status,createdAt',
      accountsReceivable: 'id,salesOutboundId,retailOrderId,sourceNo,customerCode,status,createdAt',
      receiptRecords: 'id,customerCode,sourceNo,receiptDate',
      paymentRecords: 'id,supplierCode,sourceNo,paymentDate'
    });

    this.version(5).stores({
      purchaseOrders: 'id',
      stockInRecords: 'id,purchaseOrderId,status,stockInDate',
      purchaseOrderStockInRecords: 'id,purchaseOrderId',
      purchaseReturns: 'id,sourceStockInId,status,returnDate',
      returnOutbounds: 'id,sourceReturnId,status,outboundDate',
      salesOrders: 'id,status,customerCode,orderDate',
      salesOutbounds: 'id,salesOrderId,status,outboundDate',
      salesReturns: 'id,sourceOutboundId,status,returnDate',
      retailOrders: 'id,cashierName,paymentMethod,checkoutAt',
      retailReturns: 'id,sourceRetailOrderId,returnDate',
      suppliers: 'id,code,status',
      customers: 'id,code,status',
      products: 'id,code,status',
      warehouses: 'id,code,status',
      inventoryFlows: 'id,sourceId,warehouseCode,productCode,changeType,createdAt',
      instantStocks: 'id,warehouseCode,productCode,batchNo',
      accountsPayable: 'id,stockInId,sourceNo,supplierCode,status,createdAt',
      accountsReceivable: 'id,salesOutboundId,retailOrderId,sourceNo,customerCode,status,createdAt',
      receiptRecords: 'id,customerCode,sourceNo,receiptDate',
      paymentRecords: 'id,supplierCode,sourceNo,paymentDate'
    });

    this.version(6).stores({
      purchaseOrders: 'id',
      stockInRecords: 'id,purchaseOrderId,status,stockInDate',
      purchaseOrderStockInRecords: 'id,purchaseOrderId',
      purchaseReturns: 'id,sourceStockInId,status,returnDate',
      returnOutbounds: 'id,sourceReturnId,status,outboundDate',
      salesOrders: 'id,status,customerCode,orderDate',
      salesOutbounds: 'id,salesOrderId,status,outboundDate',
      salesReturns: 'id,sourceOutboundId,status,returnDate',
      retailOrders: 'id,cashierName,paymentMethod,checkoutAt',
      retailReturns: 'id,sourceRetailOrderId,returnDate',
      suppliers: 'id,code,status',
      customers: 'id,code,status',
      products: 'id,code,status',
      warehouses: 'id,code,status',
      inventoryFlows: 'id,sourceId,warehouseCode,productCode,changeType,createdAt',
      instantStocks: 'id,warehouseCode,productCode,batchNo',
      accountsPayable: 'id,stockInId,sourceNo,supplierCode,status,createdAt',
      accountsReceivable: 'id,salesOutboundId,retailOrderId,sourceNo,customerCode,status,createdAt',
      receiptRecords: 'id,customerCode,sourceNo,receiptDate',
      paymentRecords: 'id,supplierCode,sourceNo,paymentDate',
      rfqs: 'id,status,deadline,createdAt'
    });
  }
}

export const db = new QsInventoryDb();

export type DbTableName =
  | 'purchaseOrders'
  | 'stockInRecords'
  | 'purchaseOrderStockInRecords'
  | 'purchaseReturns'
  | 'returnOutbounds'
  | 'salesOrders'
  | 'salesOutbounds'
  | 'salesReturns'
  | 'retailOrders'
  | 'retailReturns'
  | 'suppliers'
  | 'customers'
  | 'products'
  | 'warehouses'
  | 'inventoryFlows'
  | 'instantStocks'
  | 'accountsPayable'
  | 'accountsReceivable'
  | 'receiptRecords'
  | 'paymentRecords'
  | 'rfqs';

const tableCache = new Map<DbTableName, unknown[]>();
const hydratedTables = new Set<DbTableName>();
const dirtyTables = new Set<DbTableName>();

function cloneRows<T>(rows: T[]): T[] {
  return rows.map(row => ({ ...row }));
}

function withPrimaryId<T extends object>(
  rows: T[],
  primaryKey: keyof T | string = 'id'
): Array<T & { id: string }> {
  return rows.map(row => ({
    ...row,
    id: String((row as Record<string, unknown>)[String(primaryKey)] ?? (row as Record<string, unknown>).id)
  }));
}

function getTable<T>(tableName: DbTableName): Table<T, string> {
  return db.table(tableName) as Table<T, string>;
}

export function readTable<T extends object>(
  tableName: DbTableName,
  initialRows: T[],
  primaryKey: keyof T | string = 'id'
): T[] {
  if (!tableCache.has(tableName)) {
    tableCache.set(tableName, cloneRows(initialRows));
    void hydrateOrSeedTable(tableName, initialRows, primaryKey);
  }

  return cloneRows(tableCache.get(tableName) as T[]);
}

export function replaceTable<T extends object>(
  tableName: DbTableName,
  rows: T[],
  primaryKey: keyof T | string = 'id'
) {
  const nextRows = cloneRows(rows);
  tableCache.set(tableName, nextRows);
  dirtyTables.add(tableName);

  void getTable<T & { id: string }>(tableName)
    .clear()
    .then(() => getTable<T & { id: string }>(tableName).bulkPut(withPrimaryId(nextRows, primaryKey)));
}

export function getTableRows<T extends object>(tableName: DbTableName): T[] {
  return cloneRows((tableCache.get(tableName) || []) as T[]);
}

async function hydrateOrSeedTable<T extends object>(
  tableName: DbTableName,
  initialRows: T[],
  primaryKey: keyof T | string
) {
  if (hydratedTables.has(tableName)) return;

  const table = getTable<T & { id: string }>(tableName);
  const count = await table.count();

  if (count === 0) {
    if (!dirtyTables.has(tableName) && initialRows.length > 0) {
      await table.bulkPut(withPrimaryId(initialRows, primaryKey));
    }
  } else {
    const rows = await table.toArray();
    if (!dirtyTables.has(tableName)) {
      tableCache.set(tableName, cloneRows(rows));
    }
  }

  hydratedTables.add(tableName);
}
