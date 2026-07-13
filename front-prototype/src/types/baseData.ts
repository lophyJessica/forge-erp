export type BaseDataStatus = 'active' | 'inactive'; // active=启用, inactive=停用

export interface BaseSupplier {
  code: string; // 供应商编码
  name: string; // 供应商名称
  contact: string; // 联系人
  phone: string; // 电话
  settlementMethod: '月结' | '现结'; // 结算方式
  paymentPeriod: number; // 账期 (天)
  status: BaseDataStatus;
  remark?: string; // 备注
}

export interface BaseCustomer {
  code: string; // 客户编码
  name: string; // 客户名称
  contact: string; // 联系人
  phone: string; // 电话
  priceLevel: '一级' | '二级' | '三级'; // 价格级别
  creditLimit: number; // 信用额度
  paymentPeriod: number; // 账期 (天)
  status: BaseDataStatus;
  remark?: string; // 备注
}

export interface BaseProduct {
  code: string; // 商品编码
  name: string; // 商品名称
  barcode: string; // 商品条码
  category: string; // 分类
  spec: string; // 规格
  unit: string; // 单位
  defaultPurchasePrice: number; // 默认采购价
  defaultRetailPrice: number; // 默认零售价
  referenceCostPrice: number; // 参考成本价
  safetyStock?: number; // 安全库存
  status: BaseDataStatus;
}

export interface BaseWarehouse {
  code: string; // 仓库编码
  name: string; // 仓库名称
  type: '主仓' | '分仓' | '门店'; // 仓库类型
  manager: string; // 负责人
  address: string; // 地址
  status: BaseDataStatus;
}

export interface SystemLog {
  id: string;
  timestamp: string; // 操作时间
  operator: string; // 操作人
  action: string; // 动作内容
  module: string; // 关联模块
}
