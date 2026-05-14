// src/features/vendor/services/vendor-withdrawal.service.ts

const BASE = '/api/vendor-auth/withdraw';

export const REJECTION_REASON_LABELS: Record<string, string> = {
  suspected_fraud: 'Suspected Fraud',
  user_cancelled: 'Cancelled by User',
  other: 'Other',
};

export interface PendingWithdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface WithdrawalHistoryRow {
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

export interface PaginatedWithdrawalHistory {
  data: WithdrawalHistoryRow[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<APIResponse<T>> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export const vendorWithdrawalService = {
  /** GET /api/vendor-auth/withdraw/balance */
  async getBalance(): Promise<{ balance: number }> {
    const res = await apiFetch<{ balance: number }>(`${BASE}/balance`);
    return res.data ?? { balance: 0 };
  },

  /** GET /api/vendor-auth/withdraw/pending */
  async getPendingRequest(): Promise<APIResponse<PendingWithdrawal | null>> {
    return apiFetch<PendingWithdrawal | null>(`${BASE}/pending`);
  },

  /** POST /api/vendor-auth/withdraw/request */
  async submitRequest(amount: number): Promise<APIResponse<PendingWithdrawal>> {
    return apiFetch<PendingWithdrawal>(`${BASE}/request`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  /** DELETE /api/vendor-auth/withdraw/request/:id */
  async cancelRequest(id: string): Promise<APIResponse<void>> {
    return apiFetch<void>(`${BASE}/request/${id}`, { method: 'DELETE' });
  },

  /** GET /api/vendor-auth/withdraw/history */
  async listHistory(
    page = 1,
    dateStart = '',
    dateEnd = '',
  ): Promise<PaginatedWithdrawalHistory> {
    const params = new URLSearchParams({ page: String(page) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await apiFetch<PaginatedWithdrawalHistory>(
      `${BASE}/history?${params}`,
    );
    return (
      res.data ?? { data: [], total: 0, page: 1, limit: 10, total_pages: 1 }
    );
  },
};