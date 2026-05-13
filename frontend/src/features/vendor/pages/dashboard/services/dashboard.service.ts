// src/features/vendor/dashboard/services/dashboard.service.ts

import type {
  AllergenCountResponse,
  AllergenTableResponse,
  DailyProfitCard,
  TopRatedResponse,
  TopSellingResponse,
  WalletCard,
} from '../schemas/dashboard.schema';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE = '/api/vendor-auth/dashboard';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const json: APIResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? `Failed to fetch ${path}`);
  return json.data!;
}

export const dashboardService = {
  getDailyProfit: () => get<DailyProfitCard>('/daily-profit'),
  getWallet: () => get<WalletCard>('/wallet'),
  getTopSelling: () => get<TopSellingResponse>('/top-selling'),
  getTopRated: () => get<TopRatedResponse>('/top-rated'),
  getAllergenCount: () => get<AllergenCountResponse>('/allergen-count'),
  getAllergenTable: () => get<AllergenTableResponse>('/allergen-table'),
};