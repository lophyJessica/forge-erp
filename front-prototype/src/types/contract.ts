export type ContractType = 'PURCHASE' | 'SALES';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface Contract {
  id: string;
  name: string;
  type: ContractType;
  counterpartyCode: string;
  counterpartyName: string;
  amount: number;
  signDate: string;
  expireDate: string;
  status: ContractStatus;
  scanFileName?: string;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  activatedBy?: string;
  activatedAt?: string;
  terminatedBy?: string;
  terminatedAt?: string;
}
