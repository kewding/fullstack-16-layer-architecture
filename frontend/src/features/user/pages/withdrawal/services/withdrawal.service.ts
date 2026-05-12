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

// ── customer types ────────────────────────────────────────────────────────────

export interface PendingWithdrawal {
  id: string;
  amount: number;
  status: 'pending';
  created_at: string;
}

export type WithdrawalHistoryStatus = 'completed' | 'rejected';

export interface WithdrawalHistoryRow {
  id: string;
  amount: number;
  status: WithdrawalHistoryStatus;
  cashier_name: string | null;
  rejection_reason: string | null;
  rejection_comment: string | null;
  balance_before: number | null;
  balance_after: number | null;
  created_at: string;
}



// ── service ───────────────────────────────────────────────────────────────────

const CUSTOMER_BASE = '/api/customer/withdraw';


export const withdrawalService = {
  // ── customer ────────────────────────────────────────────────────────────────

  async submitRequest(amount: number): Promise<APIResponse<PendingWithdrawal>> {
    const res = await fetch(`${CUSTOMER_BASE}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return res.json();
  },

  async getPendingRequest(): Promise<APIResponse<PendingWithdrawal | null>> {
    const res = await fetch(`${CUSTOMER_BASE}/pending`);
    return res.json();
  },

  async cancelRequest(id: string): Promise<APIResponse> {
    const res = await fetch(`${CUSTOMER_BASE}/request/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async listHistory(
    page: number,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<WithdrawalHistoryRow>> {
    const params = new URLSearchParams({ page: String(page) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd)   params.set('date_end', dateEnd);
    const res = await fetch(`${CUSTOMER_BASE}/history?${params}`);
    const json: APIResponse<PaginatedResponse<WithdrawalHistoryRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch history');
    return json.data!;
  },

  
};