import { type LoginInput } from '../schemas/login.schema';

export interface APIError {
  code: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
}

const BASE_URL = '/api/auth';

export const loginService = {
  login: async (data: LoginInput): Promise<APIResponse> => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });

    return response.json();
  },

  checkSession: async (): Promise<APIResponse> => {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json' 
      },
    });

    return response.json();
  },
};
