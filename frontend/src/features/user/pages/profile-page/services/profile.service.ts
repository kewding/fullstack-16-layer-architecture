export interface UserProfileData {
  first_name: string;
  middle_name: string;
  last_name: string;
  birth_date: string;
  contact_number: string;
  customer_role: 'student' | 'teacher' | 'staff' | '';
  email: string;
}

export interface UpdateUserProfilePayload {
  first_name: string;
  middle_name: string;
  last_name: string;
  birth_date: string;
  contact_number: string;
  customer_role: 'student' | 'teacher' | 'staff';
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE_URL = '/api/customer/user';

export const userProfileService = {
  async getProfile(): Promise<UserProfileData> {
    const res = await fetch(`${BASE_URL}/profile`);
    const json: APIResponse<UserProfileData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch profile');
    return json.data!;
  },

  async updateProfile(data: UpdateUserProfilePayload): Promise<void> {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json: APIResponse = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to update profile');
  },
};
