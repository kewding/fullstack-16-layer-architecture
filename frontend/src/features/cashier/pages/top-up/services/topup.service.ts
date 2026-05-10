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

// ── cashier types ─────────────────────────────────────────────────────────────

export interface CashierRequestRow {
  id: string;
  user_id: string;
  full_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface UserDetailForCashier {
  user_id: string;
  full_name: string;
  current_balance: number;
  avg_weekly_spend: number;
}

export interface CashierRejectedRow {
  id: string;
  full_name: string;
  amount: number;
  rejection_reason: string;
  rejection_comment: string | null;
  cashier_name: string;
  created_at: string;
}

export interface CashierCompletedRow {
  id: string;
  full_name: string;
  amount: number;
  cashier_name: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export type RejectionReason = 'cancelled_upon_payment' | 'wrong_request' | 'other';

// ── service ───────────────────────────────────────────────────────────────────

const CASHIER_BASE = '/api/cashier/top-up';

export const topUpRequestService = {
  // ── cashier ──────────────────────────────────────────────────────────────────

  async listPendingRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierRequestRow>> {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/requests?${params}`);
    const json: APIResponse<PaginatedResponse<CashierRequestRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch requests');
    return json.data!;
  },

  async getUserDetailForCashier(userID: string): Promise<UserDetailForCashier> {
    const res = await fetch(`${CASHIER_BASE}/user-detail/${userID}`);
    const json: APIResponse<UserDetailForCashier> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch user detail');
    return json.data!;
  },

  async acceptRequest(id: string): Promise<APIResponse> {
    const res = await fetch(`${CASHIER_BASE}/request/${id}/accept`, { method: 'PATCH' });
    return res.json();
  },

  async rejectRequest(id: string, reason: RejectionReason, comment?: string): Promise<APIResponse> {
    const res = await fetch(`${CASHIER_BASE}/request/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, comment: comment ?? '' }),
    });
    return res.json();
  },

  async listRejectedRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierRejectedRow>> {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/rejected?${params}`);
    const json: APIResponse<PaginatedResponse<CashierRejectedRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch rejected');
    return json.data!;
  },

  async listCompletedRequests(
    page: number,
    search: string,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<CashierCompletedRow>> {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await fetch(`${CASHIER_BASE}/completed?${params}`);
    const json: APIResponse<PaginatedResponse<CashierCompletedRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch completed');
    return json.data!;
  },

  async getPendingCount(): Promise<number> {
    const res = await fetch(`${CASHIER_BASE}/pending-count`);
    const json: APIResponse<{ count: number }> = await res.json();
    if (!json.success) return 0;
    return json.data!.count;
  },
};
