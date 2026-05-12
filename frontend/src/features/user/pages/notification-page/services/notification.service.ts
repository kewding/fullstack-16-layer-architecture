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

// ── user types ────────────────────────────────────────────────────────────────

export interface PendingRequest {
  id: string;
  amount: number;
  status: 'pending';
  created_at: string;
}

export type TopUpHistoryStatus = 'accepted' | 'rejected' | 'cancelled';

export interface TopUpHistoryRow {
  id: string;
  amount: number;
  status: TopUpHistoryStatus;
  cashier_name: string | null;
  rejection_reason: string | null;
  rejection_comment: string | null;
  balance_before: number | null;
  balance_after: number | null;
  created_at: string;
}

// ── user notification types ───────────────────────────────────────────────────

export type UserNotificationType =
  | 'topup_accepted'
  | 'topup_rejected'
  | 'purchase'
  | 'withdrawal_accepted'
  | 'withdrawal_rejected';
 
export interface UserNotification {
  id: string;
  type: UserNotificationType;
  message: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── service ───────────────────────────────────────────────────────────────────

const USER_BASE = '/api/customer/top-up';
const NOTIF_BASE = '/api/customer/notifications';

export const topUpRequestService = {
  // ── user ────────────────────────────────────────────────────────────────────

  async submitRequest(amount: number): Promise<APIResponse<PendingRequest>> {
    const res = await fetch(`${USER_BASE}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    return res.json();
  },

  async getPendingRequest(): Promise<APIResponse<PendingRequest | null>> {
    const res = await fetch(`${USER_BASE}/pending`);
    return res.json();
  },

  async cancelRequest(id: string): Promise<APIResponse> {
    const res = await fetch(`${USER_BASE}/request/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async listHistory(
    page: number,
    dateStart?: string,
    dateEnd?: string,
  ): Promise<PaginatedResponse<TopUpHistoryRow>> {
    const params = new URLSearchParams({ page: String(page) });
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    const res = await fetch(`${USER_BASE}/history?${params}`);
    const json: APIResponse<PaginatedResponse<TopUpHistoryRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch history');
    return json.data!;
  },

  // ── user notifications ───────────────────────────────────────────────────────

  async getUserNotifications(): Promise<UserNotification[]> {
    const res = await fetch(NOTIF_BASE);
    const json: APIResponse<UserNotification[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch notifications');
    return json.data!;
  },

  async getUserUnreadCount(): Promise<number> {
    const res = await fetch(`${NOTIF_BASE}/unread-count`);
    const json: APIResponse<{ count: number }> = await res.json();
    if (!json.success) return 0;
    return json.data!.count;
  },

  async markUserNotificationsRead(): Promise<void> {
    await fetch(`${NOTIF_BASE}/mark-read`, { method: 'PATCH' });
  },
};
