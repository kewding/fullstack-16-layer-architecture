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

export interface LoginResponseData {
  id: string;
  email: string;
  roleId: number;
}

export interface MeResponseData {
  id: string;
  email: string;
  role_id: number;
  first_name: string;
}

const BASE_URL = '/api/auth';

export const loginService = {
  login: async (data: LoginInput): Promise<APIResponse<LoginResponseData>> => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  checkSession: async (): Promise<APIResponse<MeResponseData>> => {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
    });
    return response.json();
  },
};