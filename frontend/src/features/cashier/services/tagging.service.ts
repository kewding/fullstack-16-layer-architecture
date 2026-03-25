import type { TaggingInput } from '../pages/rfid-tagging/schemas/tagging.schema';

export interface APIError {
  code: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
}

const BASE_URL = '/api/cashier/tag';
// was: '/api/tag'

export interface TaggingData {
  userId: string; // whatever your backend returns in `data`
}

export const taggingService = {
  async submitTagging(data: TaggingInput): Promise<APIResponse<TaggingData>> {
    const response = await fetch(`${BASE_URL}/rfid-tagging`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json: APIResponse<TaggingData> = await response.json();
    return json;
  },
};
