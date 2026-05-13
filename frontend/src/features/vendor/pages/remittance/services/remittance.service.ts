// vendor-withdrawal.service.ts

import type { PaginatedWithdrawalHistory, PendingWithdrawalResponse } from "../schemas/remittance.schema";


interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE = '/api/vendor-auth/withdraw';

export const vendorWithdrawalService = {
  async getWalletBalance(): Promise<number> {
    const res = await fetch(`${BASE}/balance`);
    const json: APIResponse<{ balance: number }> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch balance');
    return json.data!.balance;
  },

  async submitRequest(amount: number): Promise<PendingWithdrawalResponse> {
    const res = await fetch(`${BASE}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const json: APIResponse<PendingWithdrawalResponse> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to submit request');
    return json.data!;
  },

  async getPendingRequest(): Promise<PendingWithdrawalResponse | null> {
    const res = await fetch(`${BASE}/pending`);
    const json: APIResponse<PendingWithdrawalResponse | null> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch pending request');
    return json.data ?? null;
  },

  async cancelRequest(id: string): Promise<void> {
    const res = await fetch(`${BASE}/request/${id}`, { method: 'DELETE' });
    const json: APIResponse = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to cancel request');
  },

  async listHistory(
    page: number,
    dateStart: string,
    dateEnd: string,
  ): Promise<PaginatedWithdrawalHistory> {
    const params = new URLSearchParams({
      page: String(page),
      ...(dateStart && { date_start: dateStart }),
      ...(dateEnd && { date_end: dateEnd }),
    });
    const res = await fetch(`${BASE}/history?${params}`);
    const json: APIResponse<PaginatedWithdrawalHistory> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch history');
    return json.data!;
  },
};