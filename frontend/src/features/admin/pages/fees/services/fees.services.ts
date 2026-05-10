export type FeeType =
  | 'utility_charges'
  | 'maintenance_rent'
  | 'insurance_administrative'
  | 'performance_security';

export const FEE_LABELS: Record<FeeType, string> = {
  utility_charges: 'Utility Charges',
  maintenance_rent: 'Maintenance & Rent',
  insurance_administrative: 'Insurance & Administrative',
  performance_security: 'Performance & Security',
};

export const FEE_DESCRIPTIONS: Record<FeeType, string> = {
  utility_charges: 'Electricity, water, and shared utility costs',
  maintenance_rent: 'Space rental and facility upkeep charges',
  insurance_administrative: 'Coverage premiums and admin overhead',
  performance_security: 'Security deposit and performance guarantees',
};

export interface FeeComponentState {
  current_month_amount: number;
  next_month_amount: number | null;
  locked: boolean;
  locked_until?: string;
  effective_month: string;
}

export interface GetFeesResponse {
  utility_charges: FeeComponentState;
  maintenance_rent: FeeComponentState;
  insurance_administrative: FeeComponentState;
  performance_security: FeeComponentState;
  total_current_month: number;
  total_next_month: number;
}

export interface SetFeeResponse {
  fee_type: FeeType;
  amount: number;
  effective_month: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE = '/api/admin';

export const feesService = {
  async getFees(): Promise<GetFeesResponse> {
    const res = await fetch(`${BASE}/concession-fees`);
    const json: APIResponse<GetFeesResponse> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch concession fees');
    }
    return json.data;
  },

  async setFee(feeType: FeeType, amount: number): Promise<SetFeeResponse> {
    const res = await fetch(`${BASE}/concession-fees/${feeType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const json: APIResponse<SetFeeResponse> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to update fee');
    }
    return json.data;
  },
};