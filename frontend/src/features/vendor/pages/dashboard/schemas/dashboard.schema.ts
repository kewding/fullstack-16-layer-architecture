// src/features/vendor/dashboard/schemas/dashboard.schema.ts

export interface DailyProfitCard {
  daily_gross_profit: number;
  monthly_fee_total: number;
  business_days_in_month: number;
  prorated_daily_fee: number;
  daily_net_profit: number;
  date: string;
}

export interface WalletCard {
  balance: number;
}

export interface TopSellingItem {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
  image_url: string | null;
}

export interface TopSellingResponse {
  items: TopSellingItem[];
}

export interface TopRatedItem {
  product_id: string;
  product_name: string;
  avg_rating: number;
  rating_count: number;
  image_url: string | null;
}

export interface TopRatedResponse {
  items: TopRatedItem[];
}

export interface AllergenCountResponse {
  count: number;
  since: string;
}

export interface AllergenInterventionRow {
  time: string;
  product_name: string;
  allergen: string;
}

export interface AllergenTableResponse {
  data: AllergenInterventionRow[];
}