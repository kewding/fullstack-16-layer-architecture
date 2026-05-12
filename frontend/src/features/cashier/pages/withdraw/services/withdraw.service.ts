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

// ── cashier types ─────────────────────────────────────────────────────────────

export interface CashierWithdrawalRow {
  id: string;
  user_id: string;
  full_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface CashierWithdrawalCompletedRow {
  id: string;
  full_name: string;
  amount: number;
  cashier_name: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface CashierWithdrawalRejectedRow {
  id: string;
  full_name: string;
  amount: number;
  rejection_reason: string;
  rejection_comment: string | null;
  cashier_name: string;
  created_at: string;
}

const CASHIER_BASE = '/api/cashier/withdraw';

export const withdrawalService = {
  // ── cashier ─────────────────────────────────────────────────────────────────

  async listPendingRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierWithdrawalRow>> {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/requests?${params}`);
    const json: APIResponse<PaginatedResponse<CashierWithdrawalRow>> = await res.json();
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
  ): Promise<PaginatedResponse<CashierWithdrawalCompletedRow>> {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/completed?${params}`);
    const json: APIResponse<PaginatedResponse<CashierWithdrawalCompletedRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch completed');
    return json.data!;
  },

  async listRejectedRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierWithdrawalRejectedRow>> {
    const params = new URLSearchParams({ page: String(page), ...(search && { search }) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/rejected?${params}`);
    const json: APIResponse<PaginatedResponse<CashierWithdrawalRejectedRow>> = await res.json();
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
