export interface PersonalInfoData {
  first_name: string;
  middle_name: string;
  last_name: string;
  birth_date: string;
  contact_number: string;
  email: string; // added — now returned by the backend
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE_URL = '/api/admin';

export const adminInfoService = {
  async getPersonalInfo(): Promise<PersonalInfoData> {
    const res = await fetch(`${BASE_URL}/profile`);
    const json: APIResponse<PersonalInfoData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch personal info');
    return json.data!;
  },

  async updatePersonalInfo(data: Omit<PersonalInfoData, 'email'>): Promise<void> {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        contact_number: data.contact_number,
      }),
    });
    const json: APIResponse = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to update personal info');
  },
};
