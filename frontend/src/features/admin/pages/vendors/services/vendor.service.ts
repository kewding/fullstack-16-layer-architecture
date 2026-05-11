import { capitalizeNameFields } from '../helper/capitalize';

// ── Review ────────────────────────────────────────────────────────────────────

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

// ── Balance ───────────────────────────────────────────────────────────────────

export interface VendorBalanceRow {
  id: string;
  stall_name: string | null;
  owner_name: string | null;
  vendor_profit: number;
  concession_fee_value: number | null;
  concession_fee: number;
  net_profit: number;
  wallet_balance: number;
}

// ── Vendor detail (shared between review modal and balance view modal) ─────────

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

// ── Former vendors ────────────────────────────────────────────────────────────

export interface FormerVendorRow {
  id: string;
  stall_name: string;
  email: string;
  owner_name: string;
  removed_by: string;
  removed_at: string;
}

export interface FormerVendorDetail {
  id: string;
  vendor_id: string;
  stall_name: string;
  email: string;
  owner_name: string;
  removed_by: string;
  removed_at: string;
  reasons: string[];
  other_reason: string | null;
  personal_info: PersonalInfoSnapshot;
  business_info: BusinessInfoSnapshot;
  ledger_summary: LedgerSummary;
}

export interface PersonalInfoSnapshot {
  first_name: string;
  middle_name: string;
  last_name: string;
  birth_date: string;
  contact_number: string;
  stall_name: string;
}

export interface BusinessInfoSnapshot {
  dti_sec_number: string;
  tin: string;
  proof_of_business_address_url: string | null;
  barangay_clearance_url: string | null;
  mayors_permit_url: string | null;
  is_dti_verified: boolean;
  is_tin_verified: boolean;
  is_documents_verified: boolean;
}

export interface LedgerSummary {
  total_gross_profit: number;
  total_concession_fees: number;
  total_remittances: number;
  final_net_balance: number;
  total_sales_count: number;
}

// ── Shared ────────────────────────────────────────────────────────────────────

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

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const vendorService = {
  // Review list
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

  // Balance list
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

  // Vendor detail
  async getVendorDetail(vendorID: string): Promise<VendorDetailResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}`);
    const json: APIResponse<VendorDetailResponse> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch vendor detail');
    return capitalizeNameFields(json.data!);
  },

  // Approve
  async approveVendor(vendorID: string): Promise<APIResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}/approve`, { method: 'PATCH' });
    return res.json();
  },

  // Revoke with reason (replaces plain DELETE revoke)
  async revokeVendorWithReason(
    vendorID: string,
    reasons: string[],
    otherReason: string,
  ): Promise<APIResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}/revoke`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasons, other_reason: otherReason }),
    });
    return res.json();
  },

  // Get wallet balance (for frontend guard)
  async getWalletBalance(vendorID: string): Promise<number> {
    const res = await fetch(`/api/admin/vendor/${vendorID}/wallet-balance`);
    const json: APIResponse<{ wallet_balance: number }> = await res.json();
    if (!json.success) return 0;
    return json.data!.wallet_balance;
  },

  // Graduate vendor
  async graduateVendor(
    vendorID: string,
    reasons: string[],
    otherReason: string,
  ): Promise<APIResponse> {
    const res = await fetch(`/api/admin/vendor/${vendorID}/graduate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasons, other_reason: otherReason }),
    });
    return res.json();
  },

  // Former vendors list
  async listFormerVendors(
    page: number,
    search: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<PaginatedResponse<FormerVendorRow>> {
    const params = new URLSearchParams({
      page: String(page),
      ...(search && { search }),
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo }),
    });
    const res = await fetch(`/api/admin/former-vendors?${params}`);
    const json: APIResponse<PaginatedResponse<FormerVendorRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch former vendors');
    return json.data!;
  },

  // Former vendor detail
  async getFormerVendorDetail(formerVendorID: string): Promise<FormerVendorDetail> {
    const res = await fetch(`/api/admin/former-vendor/${formerVendorID}`);
    const json: APIResponse<FormerVendorDetail> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch former vendor detail');
    return json.data!;
  },

  // Download ledger CSV — triggers browser download
  downloadLedgerCSV(formerVendorID: string): void {
    window.open(`/api/admin/former-vendor/${formerVendorID}/ledger-csv`, '_blank');
  },

  // Notifications
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
};