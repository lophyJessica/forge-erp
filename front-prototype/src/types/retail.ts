export type RetailPaymentMethod = 'CASH' | 'WECHAT' | 'ALIPAY';

export type RetailOrderStatus = 'CONFIRMED';

export interface RetailCartItem {
  productCode: string;
  productName: string;
  productBarcode: string;
  productSpec: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface RetailOrderItem extends RetailCartItem {
  id: string;
  amount: number;
}

export interface RetailOrder {
  id: string;
  cashierName: string;
  warehouseCode: string;
  warehouseName: string;
  status: RetailOrderStatus;
  paymentMethod: RetailPaymentMethod;
  itemCount: number;
  totalQuantity: number;
  totalAmount: number;
  discountAmount: number;
  roundOffAmount: number;
  paidAmount: number;
  checkoutAt: string;
  receiptPrinted: boolean;
  items: RetailOrderItem[];
}

export interface RetailProduct {
  code: string;
  name: string;
  barcode: string;
  category: string;
  spec: string;
  unit: string;
  price: number;
  warehouseCode: string;
  warehouseName: string;
  stockQuantity: number;
  availableQuantity: number;
}

export interface RetailCheckoutInput {
  cashierName: string;
  paymentMethod: RetailPaymentMethod;
  items: RetailCartItem[];
  discountAmount: number;
  roundOffAmount: number;
}

export interface RetailReturnItem {
  id: string;
  productCode: string;
  productName: string;
  productBarcode: string;
  productSpec: string;
  unit: string;
  purchaseQuantity: number;
  returnQuantity: number;
  price: number;
  amount: number;
}

export interface RetailReturn {
  id: string;
  sourceRetailOrderId: string;
  cashierName: string;
  warehouseCode: string;
  warehouseName: string;
  paymentMethod: RetailPaymentMethod;
  returnDate: string;
  itemCount: number;
  totalQuantity: number;
  refundAmount: number;
  operator: string;
  createdAt: string;
  confirmedAt: string;
  items: RetailReturnItem[];
}
