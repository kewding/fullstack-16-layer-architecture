export interface PersonalInfoData {
  first_name: string;
  middle_name: string;
  last_name: string;
  birth_date: string;
  contact_number: string;
  stall_name: string;
}

export interface BusinessInfoData {
  dti_sec_number: string;
  tin: string;
  proof_of_business_address_url: string | null;
  barangay_clearance_url: string | null;
  mayors_permit_url: string | null;
  is_dti_verified: boolean;
  is_tin_verified: boolean;
  is_documents_verified: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const BASE_URL = '/api/vendor-auth';

export const vendorInfoService = {
  async getPersonalInfo(): Promise<PersonalInfoData> {
    const res = await fetch(`${BASE_URL}/personal-info`);
    const json: APIResponse<PersonalInfoData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch personal info');
    return json.data!;
  },

  async updatePersonalInfo(data: PersonalInfoData): Promise<void> {
    const res = await fetch(`${BASE_URL}/personal-info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        contact_number: data.contact_number,
        stall_name: data.stall_name,
      }),
    });
    const json: APIResponse = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to update personal info');
  },

  async getBusinessInfo(): Promise<BusinessInfoData> {
    const res = await fetch(`${BASE_URL}/business-info`);
    const json: APIResponse<BusinessInfoData> = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch business info');
    return json.data!;
  },

  async updateBusinessInfo(data: { dti_sec_number: string; tin: string }): Promise<void> {
    const res = await fetch(`${BASE_URL}/business-info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json: APIResponse = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to update business info');
  },

  async uploadDocument(docType: 'business_address' | 'barangay' | 'mayors_permit', file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/documents/${docType}`, {
      method: 'POST',
      body: formData,
    });
    const json: APIResponse = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to upload document');
  },
};