import type { TopupInput } from "../pages/top-up/schemas/topup.schema";

export interface APIError {
  code: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface TopupData {
  userId: string; // whatever your backend returns in `data`
}

const BASE_URL = '/api/top-up';

export const topupService = {
  async submitTopup(data: TopupInput): Promise<APIResponse<TopupData>> {
    const response = await fetch(`${BASE_URL}/credit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json: APIResponse<TopupData> = await response.json();
    return json;
  },
};