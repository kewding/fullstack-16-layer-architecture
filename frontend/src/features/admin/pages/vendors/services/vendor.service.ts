export interface VendorReviewRow {
  id: string;
  email: string;
  owner_name: string;
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

  async listBalance(page: number, search: string): Promise<PaginatedResponse<VendorBalanceRow>> {
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
    });
    const res = await fetch(`/api/admin/vendors/balance?${params}`);
    const json: APIResponse<PaginatedResponse<VendorBalanceRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch vendors');
    return json.data!;
  },

  async revokeVendor(vendorID: string): Promise<APIResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}/revoke`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getVendorDetail(vendorID: string): Promise<VendorDetailResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}`);
    const json: APIResponse<VendorDetailResponse> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch vendor detail');
    return json.data!;
  },

  async approveVendor(vendorID: string): Promise<APIResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}/approve`, {
      method: 'PATCH',
    });
    return res.json();
  },

  async getNotifications(): Promise<Notification[]> {
    const res = await fetch('/api/admin/notifications');
    const json: APIResponse<Notification[]> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch notifications');
    return json.data!;
  },

  async getUnreadCount(): Promise<number> {
    const res = await fetch('/api/admin/notifications/unread-count');
    const json: APIResponse<{ count: number }> = await res.json();
    if (!json.success) return 0;
    return json.data!.count;
  },

  async markNotificationsRead(): Promise<void> {
    await fetch('/api/admin/notifications/mark-read', { method: 'PATCH' });
  },

  async removeFromBusiness(vendorID: string): Promise<APIResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}/remove-business`, {
      method: 'PATCH',
    });
    return res.json();
  },
};

export interface VendorDetailResponse {
  id: string;
  email: string;
  status: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birth_date: string;
  contact_number: string;
  stall_name: string;
  dti_sec_number: string;
  tin: string;
  proof_of_business_address_url: string | null;
  barangay_clearance_url: string | null;
  mayors_permit_url: string | null;
  is_dti_verified: boolean;
  is_tin_verified: boolean;
  is_documents_verified: boolean;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
