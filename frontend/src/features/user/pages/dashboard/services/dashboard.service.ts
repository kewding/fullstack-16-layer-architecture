// src/features/user/services/user-dashboard.service.ts

const BASE_URL = '/api/customer/dashboard';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NutritionTotals {
  calories_kcal: number;
  protein_g: number;
  total_fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  iron_mg: number;
  calcium_mg: number;
  vitamin_a_mcg: number;
  vitamin_c_mg: number;
  vitamin_e_mg: number;
  magnesium_mg: number;
  potassium_mg: number;
}

export interface NutritionLimits {
  calories_kcal: number;
  protein_g: number;
  total_fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  iron_mg: number;
  calcium_mg: number;
  vitamin_a_mcg: number;
  vitamin_c_mg: number;
  vitamin_e_mg: number;
  magnesium_mg: number;
  potassium_mg: number;
}

export interface NutritionData {
  totals: NutritionTotals;
  limits: NutritionLimits;
}

export interface PurchaseItem {
  sale_id: string;
  sale_item_id: string;
  product_name: string;
  image_url: string | null;
  stall_name: string;
  quantity: number;
  extended_price: number;
  purchased_at: string; // ISO-8601
}

export interface PurchasesData {
  items: PurchaseItem[];
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// ── Service ───────────────────────────────────────────────────────────────────

export const userDashboardService = {
  async getNutrition(): Promise<NutritionData> {
    const res = await fetch(`${BASE_URL}/nutrition`);
    const json: APIResponse<NutritionData> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch nutrition data');
    }
    return json.data;
  },

  async getRecentPurchases(): Promise<PurchasesData> {
    const res = await fetch(`${BASE_URL}/purchases`);
    const json: APIResponse<PurchasesData> = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error?.message ?? 'Failed to fetch purchases');
    }
    return json.data;
  },
};