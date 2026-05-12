import type { APIResponse, PaginatedResponse } from '@/lib/types';

export type TransactionType = 'purchase' | 'top-up' | 'withdraw';
export type TransactionTypeFilter = TransactionType | '';

export type PurchaseStatus = 'completed' | 'refunded' | 'blocked';

export interface TransactionRow {
  id: string;
  reference_type: TransactionType;
  /** Human-readable label from the backend, e.g. "Balance Top-up" */
  label: string;
  /** Positive = credit (top-up), negative = debit (purchase / withdrawal) */
  amount: number;
  new_balance: number;
  status: PurchaseStatus | '';
  created_at: string; // ISO 8601
}

export interface TransactionListParams {
  type?: TransactionTypeFilter;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const transactionHistoryService = {
  async list(params: TransactionListParams = {}): Promise<PaginatedResponse<TransactionRow>> {
    const query = new URLSearchParams();

    if (params.type) query.set('type', params.type);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/customer/transactions?${query.toString()}`);
    const json: APIResponse<PaginatedResponse<TransactionRow>> = await res.json();

    if (!json.success) {
      throw new Error(json.error?.message ?? 'Failed to fetch transactions');
    }

    return {
      ...json.data!,
      data: json.data?.data ?? [],
    };
  },
};
