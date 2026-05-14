// src/features/vendor/services/vendor-transactions.service.ts

const BASE = '/api/vendor-auth/transactions';

export type VendorTxType = '' | 'purchase' | 'remittance' | 'fee';

export interface VendorTxRow {
  id: string;
  entry_type: VendorTxType;
  label: string;
  amount: number;
  direction: number;      // +1 credit | -1 debit
  signed_amount: number;  // amount * direction
  new_balance: number;
  reference_id: string | null;
  reference_number: string;
  billing_month: string | null;
  created_at: string;
}

export interface VendorTxListResponse {
  data: VendorTxRow[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface VendorTxListParams {
  type?: VendorTxType;
  from?: string;   // YYYY-MM-DD
  to?: string;     // YYYY-MM-DD
  page?: number;
  limit?: number;
}

// Sale detail (reuses admin endpoint GET /api/admin/transactions/purchase/:id)
export interface SaleItem {
  product_name: string;
  quantity: number;
  price: number;
  extended: number;
}

export interface SaleDetail {
  sale_id: string;
  stall_name: string;
  total: number;
  items: SaleItem[];
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? 'Request failed');
  return json.data as T;
}

export const vendorTransactionsService = {
  /** GET /api/vendor-auth/transactions */
  async list(params: VendorTxListParams = {}): Promise<VendorTxListResponse> {
    const q = new URLSearchParams();
    if (params.type) q.set('type', params.type);
    if (params.from) q.set('from', params.from);
    if (params.to) q.set('to', params.to);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));

    return apiFetch<VendorTxListResponse>(`${BASE}?${q}`);
  },

  /**
   * GET /api/admin/transactions/purchase/:id
   * Used to show per-sale item breakdown in the detail modal.
   * gross_profit entries have reference_id = sale UUID.
   */
  async getSaleDetail(saleId: string): Promise<SaleDetail> {
    return apiFetch<SaleDetail>(
      `/api/admin/transactions/purchase/${saleId}`,
    );
  },
};