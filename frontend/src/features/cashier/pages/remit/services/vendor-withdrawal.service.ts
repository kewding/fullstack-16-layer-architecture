// ── shared types ──────────────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ── rejection reasons ─────────────────────────────────────────────────────────

export type RejectionReason = 'suspected_fraud' | 'user_cancelled' | 'other';

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  suspected_fraud: 'Suspected Fraud',
  user_cancelled: 'User Cancelled',
  other: 'Other',
};

// ── cashier-facing types ──────────────────────────────────────────────────────

export interface CashierVendorWithdrawalRow {
  id: string;
  user_id: string;
  vendor_id: string;
  full_name: string;
  stall_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface CashierVendorWithdrawalCompletedRow {
  id: string;
  full_name: string;
  stall_name: string;
  amount: number;
  cashier_name: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface CashierVendorWithdrawalRejectedRow {
  id: string;
  full_name: string;
  stall_name: string;
  amount: number;
  rejection_reason: string;
  rejection_comment: string | null;
  cashier_name: string;
  created_at: string;
}

// ── vendor-facing types ───────────────────────────────────────────────────────

export interface PendingVendorWithdrawalResponse {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface VendorWithdrawalHistoryRow {
  id: string;
  amount: number;
  status: string;
  cashier_name: string | null;
  rejection_reason: string | null;
  rejection_comment: string | null;
  balance_before: number | null;
  balance_after: number | null;
  created_at: string;
}

// ── base URLs ─────────────────────────────────────────────────────────────────

const CASHIER_BASE = '/api/cashier/vendor-remit';
const VENDOR_BASE  = '/api/vendor-auth/withdraw';

// ── cashier service ───────────────────────────────────────────────────────────

export const vendorWithdrawalService = {
  async listPendingRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierVendorWithdrawalRow>> {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd)   params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/requests?${params}`);
    const json: APIResponse<PaginatedResponse<CashierVendorWithdrawalRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch requests');
    return json.data!;
  },

  async completeRequest(id: string): Promise<APIResponse> {
    const res = await fetch(`${CASHIER_BASE}/request/${id}/complete`, { method: 'PATCH' });
    return res.json();
  },

  async rejectRequest(id: string, reason: RejectionReason, comment: string): Promise<APIResponse> {
    const res = await fetch(`${CASHIER_BASE}/request/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, comment }),
    });
    return res.json();
  },

  async listCompletedRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierVendorWithdrawalCompletedRow>> {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd)   params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/completed?${params}`);
    const json: APIResponse<PaginatedResponse<CashierVendorWithdrawalCompletedRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch completed');
    return json.data!;
  },

  async listRejectedRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierVendorWithdrawalRejectedRow>> {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd)   params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/rejected?${params}`);
    const json: APIResponse<PaginatedResponse<CashierVendorWithdrawalRejectedRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch rejected');
    return json.data!;
  },

  async getPendingCount(): Promise<number> {
    const res = await fetch(`${CASHIER_BASE}/pending-count`);
    const json: APIResponse<{ count: number }> = await res.json();
    if (!json.success) return 0;
    return json.data!.count;
  },
};

// ── vendor service ────────────────────────────────────────────────────────────

export const vendorWithdrawSelfService = {
  async getWalletBalance(): Promise<number> {
    const res = await fetch(`${VENDOR_BASE}/balance`);
    const json: APIResponse<{ balance: number }> = await res.json();
    if (!json.success) return 0;
    return json.data!.balance;
  },

  async submitRequest(amount: number): Promise<APIResponse<PendingVendorWithdrawalResponse>> {
    const res = await fetch(`${VENDOR_BASE}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return res.json();
  },

  async getPendingRequest(): Promise<PendingVendorWithdrawalResponse | null> {
    const res = await fetch(`${VENDOR_BASE}/pending`);
    const json: APIResponse<PendingVendorWithdrawalResponse | null> = await res.json();
    if (!json.success) return null;
    return json.data ?? null;
  },

  async cancelRequest(id: string): Promise<APIResponse> {
    const res = await fetch(`${VENDOR_BASE}/request/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async listHistory(
    page: number,
    limit = 10,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<VendorWithdrawalHistoryRow>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd)   params.set('date_end', dateEnd);
    const res = await fetch(`${VENDOR_BASE}/history?${params}`);
    const json: APIResponse<PaginatedResponse<VendorWithdrawalHistoryRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch history');
    return json.data!;
  },
};