// vendor-withdrawal.schema.ts

export interface PendingWithdrawalResponse {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface WithdrawalHistoryRow {
  id: string;
  amount: number;
  status: 'completed' | 'rejected';
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

export type RejectionReason = 'suspected_fraud' | 'user_cancelled' | 'other';