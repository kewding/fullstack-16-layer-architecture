import type { APIResponse } from "../../user-records/services/customer.service";


export interface StatCardsData {
  daily_nqs: number;
  daily_allergen_count: number;
  total_gross_sales: number;
}

export interface NQSTrendPoint {
  date: string;   // YYYY-MM-DD
  score: number;
}

export interface NQSTrendData {
  points: NQSTrendPoint[];
}

export interface AllergenInterventionRow {
  time: string;           // ISO-8601
  product_name: string;
  allergen: string;
  stall_name: string;
}

export interface AllergenInterventionsData {
  data: AllergenInterventionRow[];
}

export interface NutrientBar {
  nutrient: string;
  percent_dv: number;
  is_limited: boolean;
}

export interface NutritionalTargetData {
  nutrients: NutrientBar[];
}

export interface StallRevenueRow {
  stall_name: string;
  gross_sales: number;
  concession_fee: number;
  net_to_vendor: number;
}

export interface RevenueDistributionData {
  stalls: StallRevenueRow[];
  total_gross: number;
}

export interface StallSettlementRow {
  stall_name: string;
  total_revenue: number;
  remitted_amount: number;
  remaining_balance: number;
}

export interface StallSettlementData {
  stalls: StallSettlementRow[];
}

function buildDateParams(dateFrom?: string, dateTo?: string): URLSearchParams {
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  return params;
}

export const dashboardService = {
  async getStatCards(dateFrom?: string, dateTo?: string): Promise<StatCardsData> {
    const params = buildDateParams(dateFrom, dateTo);
    const res = await fetch(`/api/admin/dashboard/stat-cards?${params}`);
    const json: APIResponse<StatCardsData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch stat cards');
    return json.data!;
  },

  async getNQSTrend(): Promise<NQSTrendData> {
    const res = await fetch('/api/admin/dashboard/nqs-trend');
    const json: APIResponse<NQSTrendData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch NQS trend');
    return json.data!;
  },

  async getAllergenInterventions(dateFrom?: string, dateTo?: string): Promise<AllergenInterventionsData> {
    const params = buildDateParams(dateFrom, dateTo);
    const res = await fetch(`/api/admin/dashboard/allergen-interventions?${params}`);
    const json: APIResponse<AllergenInterventionsData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch allergen interventions');
    return json.data!;
  },

  async getNutritionalTarget(dateFrom?: string, dateTo?: string): Promise<NutritionalTargetData> {
    const params = buildDateParams(dateFrom, dateTo);
    const res = await fetch(`/api/admin/dashboard/nutritional-target?${params}`);
    const json: APIResponse<NutritionalTargetData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch nutritional target');
    return json.data!;
  },

  async getRevenueDistribution(dateFrom?: string, dateTo?: string): Promise<RevenueDistributionData> {
    const params = buildDateParams(dateFrom, dateTo);
    const res = await fetch(`/api/admin/dashboard/revenue-distribution?${params}`);
    const json: APIResponse<RevenueDistributionData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch revenue distribution');
    return json.data!;
  },

  async getStallSettlement(): Promise<StallSettlementData> {
    const res = await fetch('/api/admin/dashboard/stall-settlement');
    const json: APIResponse<StallSettlementData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch stall settlement');
    return json.data!;
  },
};