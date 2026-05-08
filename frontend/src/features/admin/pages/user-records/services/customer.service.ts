export type CustomerRole = 'student' | 'teacher' | 'faculty';

export interface CustomerRow {
  user_id: string;
  inst_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  customer_role: CustomerRole;
  created_at: string;  // ISO-8601 — "Date Registered"
  deleted_at: string | null; // non-null only in inactive list
}

export interface CustomerDetailResponse {
  // Personal
  user_id: string;
  inst_id: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birth_date: string;
  contact_no: string;
  customer_role: CustomerRole;
  created_at: string;
  // RFID
  rfid_tag: string | null;
  rfid_is_active: boolean | null;
  // Medical
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  allergens: string[];
  custom_allergens: string[];
  medical_conditions: string[];
  medications: string[];
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  emergency_contact_relationship: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export type CustomerStatusFilter = 'active' | 'inactive';

export const customerService = {
  async listCustomers(
    page: number,
    limit: number,
    search: string,
    status: CustomerStatusFilter,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<PaginatedResponse<CustomerRow>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      status,
      ...(search && { search }),
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo }),
    });

    const res = await fetch(`/api/admin/users/customers?${params}`);
    const json: APIResponse<PaginatedResponse<CustomerRow>> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch customers');
    return json.data!;
  },

  async getCustomerDetail(userID: string): Promise<CustomerDetailResponse> {
    const res = await fetch(`/api/admin/users/customer/${userID}`);
    const json: APIResponse<CustomerDetailResponse> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch customer detail');
    return json.data!;
  },

  async disableCustomer(userID: string): Promise<APIResponse> {
    const res = await fetch(`/api/admin/users/customer/${userID}/disable`, {
      method: 'PATCH',
    });
    return res.json();
  },

  async reactivateCustomer(userID: string): Promise<APIResponse> {
    const res = await fetch(`/api/admin/users/customer/${userID}/reactivate`, {
      method: 'PATCH',
    });
    return res.json();
  },
};