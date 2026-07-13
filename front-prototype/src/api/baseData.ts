import { BaseSupplier, BaseCustomer, BaseProduct, BaseWarehouse, SystemLog } from '../types/baseData';
import { readTable, replaceTable } from '../db';

export type PriceLevelName = BaseCustomer['priceLevel'] | '零售';

export interface PriceLevelSummary {
  level: PriceLevelName;
  defaultDiscountRate: number;
  skuCount: number;
  lastUpdated: string;
}

export interface LevelProductPrice {
  level: PriceLevelName;
  productCode: string;
  productName: string;
  category: string;
  spec: string;
  baseRetailPrice: number;
  levelPrice: number;
  discountRate: number;
}

export interface PriceChangeRecord {
  id: string;
  productCode: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changeType: '采购' | '销售' | '零售';
  operator: string;
  changedAt: string;
}

// --- Dexie 核心读写逻辑 ---
export const baseDataApi = {
  // ================= 供应商档案 API =================
  getSuppliers(): BaseSupplier[] {
    return readTable('suppliers', getInitialSuppliers(), 'code');
  },

  getSupplierByCode(code: string): BaseSupplier | null {
    const list = this.getSuppliers();
    return list.find(x => x.code === code) || null;
  },

  saveSupplier(data: BaseSupplier): BaseSupplier {
    const list = this.getSuppliers();
    const idx = list.findIndex(x => x.code === data.code);

    if (idx === -1) {
      // 新增，检查编码冲突
      const dup = list.some(x => x.code.toUpperCase().trim() === data.code.toUpperCase().trim());
      if (dup) throw new Error(`供应商编码【${data.code}】已被占用，请使用其他编码`);
      list.unshift({ ...data, status: 'active' });
    } else {
      // 修改
      list[idx] = { ...list[idx], ...data };
    }
    replaceTable('suppliers', list, 'code');
    return data;
  },

  toggleSupplierStatus(code: string, status?: 'active' | 'inactive', disableReason?: string): BaseSupplier {
    const list = this.getSuppliers();
    const idx = list.findIndex(x => x.code === code);
    if (idx === -1) throw new Error('供应商不存在');
    const targetStatus = status || (list[idx].status === 'active' ? 'inactive' : 'active');
    list[idx].status = targetStatus;
    if (targetStatus === 'inactive') {
      (list[idx] as any).disableReason = disableReason;
    } else {
      delete (list[idx] as any).disableReason;
    }
    replaceTable('suppliers', list, 'code');
    return list[idx];
  },

  // ================= 客户档案 API =================
  getCustomers(): BaseCustomer[] {
    return readTable('customers', getInitialCustomers(), 'code');
  },

  getCustomerByCode(code: string): BaseCustomer | null {
    const list = this.getCustomers();
    return list.find(x => x.code === code) || null;
  },

  saveCustomer(data: BaseCustomer): BaseCustomer {
    const list = this.getCustomers();
    const idx = list.findIndex(x => x.code === data.code);

    if (idx === -1) {
      const dup = list.some(x => x.code.toUpperCase().trim() === data.code.toUpperCase().trim());
      if (dup) throw new Error(`客户编码【${data.code}】已被占用`);
      list.unshift({ ...data, status: 'active' });
    } else {
      list[idx] = { ...list[idx], ...data };
    }
    replaceTable('customers', list, 'code');
    return data;
  },

  toggleCustomerStatus(code: string, status?: 'active' | 'inactive', disableReason?: string): BaseCustomer {
    const list = this.getCustomers();
    const idx = list.findIndex(x => x.code === code);
    if (idx === -1) throw new Error('客户不存在');
    const targetStatus = status || (list[idx].status === 'active' ? 'inactive' : 'active');
    list[idx].status = targetStatus;
    if (targetStatus === 'inactive') {
      (list[idx] as any).disableReason = disableReason;
    } else {
      delete (list[idx] as any).disableReason;
    }
    replaceTable('customers', list, 'code');
    return list[idx];
  },

  // ================= 商品档案 API =================
  getProducts(): BaseProduct[] {
    return readTable('products', getInitialProducts(), 'code');
  },

  getProductByCode(code: string): BaseProduct | null {
    const list = this.getProducts();
    return list.find(x => x.code === code) || null;
  },

  saveProduct(data: BaseProduct): BaseProduct {
    const list = this.getProducts();
    const idx = list.findIndex(x => x.code === data.code);

    if (idx === -1) {
      const dup = list.some(x => x.code.toUpperCase().trim() === data.code.toUpperCase().trim());
      if (dup) throw new Error(`商品编码【${data.code}】已被占用`);
      list.unshift({ ...data, status: 'active' });
    } else {
      list[idx] = { ...list[idx], ...data };
    }
    replaceTable('products', list, 'code');
    return data;
  },

  toggleProductStatus(code: string, status?: 'active' | 'inactive', disableReason?: string): BaseProduct {
    const list = this.getProducts();
    const idx = list.findIndex(x => x.code === code);
    if (idx === -1) throw new Error('商品不存在');
    const targetStatus = status || (list[idx].status === 'active' ? 'inactive' : 'active');
    list[idx].status = targetStatus;
    if (targetStatus === 'inactive') {
      (list[idx] as any).disableReason = disableReason;
    } else {
      delete (list[idx] as any).disableReason;
    }
    replaceTable('products', list, 'code');
    return list[idx];
  },

  // ================= 仓库档案 API =================
  getWarehouses(): BaseWarehouse[] {
    return readTable('warehouses', getInitialWarehouses(), 'code');
  },

  getWarehouseByCode(code: string): BaseWarehouse | null {
    const list = this.getWarehouses();
    return list.find(x => x.code === code) || null;
  },

  saveWarehouse(data: BaseWarehouse): BaseWarehouse {
    const list = this.getWarehouses();
    const idx = list.findIndex(x => x.code === data.code);

    if (idx === -1) {
      const dup = list.some(x => x.code.toUpperCase().trim() === data.code.toUpperCase().trim());
      if (dup) throw new Error(`仓库编码【${data.code}】已被占用`);
      list.unshift({ ...data, status: 'active' });
    } else {
      list[idx] = { ...list[idx], ...data };
    }
    replaceTable('warehouses', list, 'code');
    return data;
  },

  toggleWarehouseStatus(code: string, status?: 'active' | 'inactive', disableReason?: string): BaseWarehouse {
    const list = this.getWarehouses();
    const idx = list.findIndex(x => x.code === code);
    if (idx === -1) throw new Error('仓库不存在');
    const targetStatus = status || (list[idx].status === 'active' ? 'inactive' : 'active');
    list[idx].status = targetStatus;
    if (targetStatus === 'inactive') {
      (list[idx] as any).disableReason = disableReason;
    } else {
      delete (list[idx] as any).disableReason;
    }
    replaceTable('warehouses', list, 'code');
    return list[idx];
  },

  // ================= 价格管理只读 Mock =================
  getPriceLevelSummaries(): PriceLevelSummary[] {
    const skuCount = this.getProducts().filter(x => x.status === 'active').length;
    return [
      { level: '一级', defaultDiscountRate: 82, skuCount, lastUpdated: '2026-07-05 16:20' },
      { level: '二级', defaultDiscountRate: 88, skuCount, lastUpdated: '2026-07-05 15:10' },
      { level: '三级', defaultDiscountRate: 94, skuCount, lastUpdated: '2026-07-04 18:35' },
      { level: '零售', defaultDiscountRate: 100, skuCount, lastUpdated: '2026-07-04 10:00' }
    ];
  },

  getProductPricesByLevel(level: PriceLevelName): LevelProductPrice[] {
    const rates: Record<PriceLevelName, number> = { 一级: 82, 二级: 88, 三级: 94, 零售: 100 };
    const discountRate = rates[level];
    return this.getProducts()
      .filter(product => product.status === 'active')
      .map(product => ({
        level,
        productCode: product.code,
        productName: product.name,
        category: product.category,
        spec: product.spec,
        baseRetailPrice: product.defaultRetailPrice,
        levelPrice: Number((product.defaultRetailPrice * discountRate / 100).toFixed(2)),
        discountRate
      }));
  },

  getRecentPriceChanges(): PriceChangeRecord[] {
    return getInitialPriceChanges();
  },


  // ================= 系统设置操作日志 (只读 10 条) =================
  getSystemLogs(): SystemLog[] {
    return [
      { id: 'LOG001', timestamp: '2026-07-05 18:48:04', operator: 'admin', action: '确认采购入库单 PI20260704-0005', module: '采购入库' },
      { id: 'LOG002', timestamp: '2026-07-05 18:43:12', operator: 'admin', action: '修改系统配置文件 tsconfig.app.json', module: '系统管理' },
      { id: 'LOG003', timestamp: '2026-07-05 18:00:22', operator: 'Storekeeper01', action: '确认采购退货单 PR20260704-0001', module: '采购退货' },
      { id: 'LOG004', timestamp: '2026-07-05 17:30:15', operator: 'Storekeeper02', action: '确认退货出库单 PRO20260705-0001', module: '退货出库' },
      { id: 'LOG005', timestamp: '2026-07-05 15:00:00', operator: 'Storekeeper01', action: '执行商品 SKU004 报损出库 1台', module: '库存管理' },
      { id: 'LOG006', timestamp: '2026-07-05 14:30:00', operator: 'Buyer01', action: '新建采购订单 PO20260705-0001', module: '采购订单' },
      { id: 'LOG007', timestamp: '2026-07-05 11:20:00', operator: 'admin', action: '停用商品档案 SKU005', module: '基础资料' },
      { id: 'LOG008', timestamp: '2026-07-05 10:15:30', operator: 'admin', action: '启用仓库档案 WH004', module: '基础资料' },
      { id: 'LOG009', timestamp: '2026-07-05 09:30:12', operator: 'Storekeeper01', action: '确认采购入库单 PI20260704-0001', module: '采购入库' },
      { id: 'LOG010', timestamp: '2026-07-05 09:00:00', operator: 'admin', action: '系统登录成功', module: '系统管理' }
    ];
  }
};

// --- 初始化数据辅助函数 ---
function getInitialSuppliers(): BaseSupplier[] {
  return [
    { code: 'VEND001', name: '北京强盛贸易有限公司', contact: '张强', phone: '13800138000', settlementMethod: '月结', paymentPeriod: 30, status: 'active', remark: '办公用品大宗长期合作商' },
    { code: 'VEND002', name: '上海腾飞电子器材厂', contact: '李飞', phone: '13911223344', settlementMethod: '现结', paymentPeriod: 0, status: 'active', remark: '电子周边及高速U盘采购渠道' },
    { code: 'VEND003', name: '广州力行包装材料公司', contact: '王力', phone: '13655667788', settlementMethod: '月结', paymentPeriod: 60, status: 'active', remark: '包装及纸品供应商' },
    { code: 'VEND004', name: '深圳佳美百货批发部', contact: '赵美', phone: '13599887766', settlementMethod: '现结', paymentPeriod: 0, status: 'inactive', remark: '备用停用批发商' },
    { code: 'VEND005', name: '杭州中盛机械设备有限公司', contact: '孙中', phone: '18877665544', settlementMethod: '月结', paymentPeriod: 15, status: 'active', remark: '仓储物流辅助设备提供商' }
  ];
}

function getInitialCustomers(): BaseCustomer[] {
  return [
    { code: 'CUST001', name: '北京晨光文具加盟店', contact: '刘晨', phone: '18611223344', priceLevel: '一级', creditLimit: 50000, paymentPeriod: 30, status: 'active', remark: '优质批发客户' },
    { code: 'CUST002', name: '上海好德便利店连锁', contact: '陈好', phone: '18544332211', priceLevel: '二级', creditLimit: 100000, paymentPeriod: 45, status: 'active', remark: '连锁商超，账期稳定' },
    { code: 'CUST003', name: '广州大学城红叶书店', contact: '胡叶', phone: '13388776655', priceLevel: '三级', creditLimit: 10000, paymentPeriod: 15, status: 'active', remark: '学校文具供货点' },
    { code: 'CUST004', name: '深圳卓越办公设备行', contact: '何卓', phone: '13199887766', priceLevel: '一级', creditLimit: 200000, paymentPeriod: 60, status: 'active', remark: '大型分销代理' },
    { code: 'CUST005', name: '杭州淘文创工作室', contact: '徐淘', phone: '18999882233', priceLevel: '三级', creditLimit: 0, paymentPeriod: 0, status: 'inactive', remark: '停用工作室' }
  ];
}

function getInitialProducts(): BaseProduct[] {
  return [
    { code: 'SKU001', name: '双鸭牌标准型回形针', barcode: '6901234567890', category: '办公文具', spec: '100枚/盒', unit: '盒', defaultPurchasePrice: 2.5, defaultRetailPrice: 5.0, referenceCostPrice: 2.3, status: 'active' },
    { code: 'SKU002', name: '晨光按动式中性笔黑色', barcode: '6902345678901', category: '书写工具', spec: '0.5mm', unit: '支', defaultPurchasePrice: 1.8, defaultRetailPrice: 3.5, referenceCostPrice: 1.7, status: 'active' },
    { code: 'SKU003', name: '强盛定制纯木浆A4复印纸', barcode: '6903456789012', category: '办公用纸', spec: '80g 500张/包', unit: '包', defaultPurchasePrice: 16.5, defaultRetailPrice: 28.0, referenceCostPrice: 15.8, status: 'active' },
    { code: 'SKU004', name: '得力多功能计算器', barcode: '6904567890234', category: '办公电器', spec: '十二位液晶大屏', unit: '台', defaultPurchasePrice: 32.0, defaultRetailPrice: 58.0, referenceCostPrice: 30.5, status: 'active' },
    { code: 'SKU005', name: '白雪直液式走珠笔红色', barcode: '6905678901235', category: '书写工具', spec: '0.5mm', unit: '支', defaultPurchasePrice: 1.5, defaultRetailPrice: 3.0, referenceCostPrice: 1.4, status: 'inactive' },
    { code: 'SKU006', name: '金士顿64GB高速U盘', barcode: '6906789012346', category: '数码周边', spec: 'USB 3.2 金属机身', unit: '个', defaultPurchasePrice: 45.0, defaultRetailPrice: 79.0, referenceCostPrice: 42.0, status: 'active' }
  ];
}

function getInitialWarehouses(): BaseWarehouse[] {
  return [
    { code: 'WH001', name: '北京主仓', type: '主仓', manager: '马保国', address: '北京市朝阳区酒仙桥路10号院', status: 'active' },
    { code: 'WH002', name: '上海分仓', type: '分仓', manager: '雷军', address: '上海市浦东新区张江高科技园区', status: 'active' },
    { code: 'WH003', name: '广州越秀仓', type: '分仓', manager: '丁磊', address: '广州市天河区科韵路中', status: 'active' },
    { code: 'WH004', name: '成都温江仓', type: '分仓', manager: '王建国', address: '成都市温江区海峡两岸科技园', status: 'inactive' },
    { code: 'WH005', name: '深圳直营门店', type: '门店', manager: '张小龙', address: '深圳市南山区腾讯大厦一楼', status: 'active' }
  ];
}


function getInitialPriceChanges(): PriceChangeRecord[] {
  return [
    { id: 'PC20260705001', productCode: 'SKU006', productName: '金士顿64GB高速U盘', oldPrice: 75.0, newPrice: 79.0, changeType: '零售', operator: 'admin', changedAt: '2026-07-05 16:20' },
    { id: 'PC20260705002', productCode: 'SKU004', productName: '得力多功能计算器', oldPrice: 55.0, newPrice: 58.0, changeType: '零售', operator: 'admin', changedAt: '2026-07-05 15:10' },
    { id: 'PC20260705003', productCode: 'SKU003', productName: '强盛定制纯木浆A4复印纸', oldPrice: 15.8, newPrice: 16.5, changeType: '采购', operator: 'Buyer01', changedAt: '2026-07-05 14:42' },
    { id: 'PC20260704001', productCode: 'SKU002', productName: '晨光按动式中性笔黑色', oldPrice: 3.2, newPrice: 3.5, changeType: '零售', operator: 'admin', changedAt: '2026-07-04 18:35' },
    { id: 'PC20260704002', productCode: 'SKU001', productName: '双鸭牌标准型回形针', oldPrice: 4.8, newPrice: 5.0, changeType: '销售', operator: 'SalesMgr', changedAt: '2026-07-04 17:10' },
    { id: 'PC20260703001', productCode: 'SKU006', productName: '金士顿64GB高速U盘', oldPrice: 42.0, newPrice: 45.0, changeType: '采购', operator: 'Buyer02', changedAt: '2026-07-03 11:26' },
    { id: 'PC20260702001', productCode: 'SKU003', productName: '强盛定制纯木浆A4复印纸', oldPrice: 26.8, newPrice: 28.0, changeType: '销售', operator: 'SalesMgr', changedAt: '2026-07-02 10:18' },
    { id: 'PC20260701001', productCode: 'SKU005', productName: '白雪直液式走珠笔红色', oldPrice: 2.8, newPrice: 3.0, changeType: '零售', operator: 'admin', changedAt: '2026-07-01 09:05' }
  ];
}
