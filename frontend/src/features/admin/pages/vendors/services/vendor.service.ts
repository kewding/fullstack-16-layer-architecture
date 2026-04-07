export interface VendorReviewRow {
  id: string;
  email: string;
  stall_name: string | null;
  status: 'invited' | 'for_review' | 'in_business';
  invited_by_name: string;
  invited_at: string;
  registered_at: string | null;
}

export interface VendorBalanceRow {
  id: string;
  stall_name: string | null;
  owner_name: string | null;
  vendor_profit: number;
  concession_fee_type: 'percentage' | 'fixed' | null;
  concession_fee_value: number | null;
  concession_fee: number;
  net_profit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export type VendorStatusFilter = 'invited' | 'for_review' | 'in_business' | '';

export const vendorService = {
  async listReview(
    page: number,
    search: string,
    status: VendorStatusFilter,
  ): Promise<PaginatedResponse<VendorReviewRow>> {
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
      ...(status && { status }),
    });
    const res = await fetch(`/api/admin/vendors/review?${params}`);
    const json: APIResponse<PaginatedResponse<VendorReviewRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch vendors');
    return json.data!;
  },

  async listBalance(
    page: number,
    search: string,
  ): Promise<PaginatedResponse<VendorBalanceRow>> {
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
    });
    const res = await fetch(`/api/admin/vendors/balance?${params}`);
    const json: APIResponse<PaginatedResponse<VendorBalanceRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch vendors');
    return json.data!;
  },
};