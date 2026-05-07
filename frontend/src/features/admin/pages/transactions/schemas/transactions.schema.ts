export type VendorTxType = 'sale' | 'remittance' | '';
export type CustomerTxType = 'purchase' | 'top-up' | 'refund' | 'withdraw' | '';
export type MainTabType = 'vendor' | 'customer';

export interface VendorTxRow {
  id: string;
  date: string;
  type: string;
  owner_name: string;
  stall_name: string;
  amount: number;
}

export interface CustomerTxRow {
  id: string;
  date: string;
  type: string;
  full_name: string;
  amount: number;
  status: string;
}

export interface PurchaseItem {
  product_name: string;
  quantity: number;
  price: number;
  extended: number;
}

export interface PurchaseDetail {
  sale_id: string;
  stall_name: string;
  total: number;
  items: PurchaseItem[];
}

export interface PaginatedVendorTx {
  data: VendorTxRow[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedCustomerTx {
  data: CustomerTxRow[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
