export interface MedicalInfoData {
  blood_type: string;
  height_cm: number;
  weight_kg: number;
  allergens: string[];
  custom_allergens: string[];
  medical_conditions: string[];
  medications: string[];
  emergency_contact_name: string;
  emergency_contact_number: string;
  emergency_contact_relationship: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE_URL = '/api/customer';

export const medicalInfoService = {
  async getMedicalInfo(): Promise<MedicalInfoData> {
    const res = await fetch(`${BASE_URL}/medical-info`);
    const json: APIResponse<MedicalInfoData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch medical info');
    return json.data!;
  },

  async upsertMedicalInfo(data: MedicalInfoData): Promise<void> {
    const res = await fetch(`${BASE_URL}/medical-info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json: APIResponse = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to save medical info');
  },
};