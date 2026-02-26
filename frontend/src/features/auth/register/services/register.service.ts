import { type RegisterInput } from '../schemas/register.schema';

export interface APIError {
  code: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
}

const BASE_URL = '/api/register';

export const registerService = {
  // POST /api/register/check-institutional-id [2, 6]
  checkID: async (institutionalId: string): Promise<APIResponse<void>> => {
    const response = await fetch(`${BASE_URL}/check-institutional-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionalId }),
    });
    return response.json();
  },

  // POST /api/register/check-email [2, 7]
  checkEmail: async (email: string): Promise<APIResponse<void>> => {
    const response = await fetch(`${BASE_URL}/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  // POST /api/register/ [2, 5]
  submit: async (data: RegisterInput): Promise<APIResponse<void>> => {
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
};