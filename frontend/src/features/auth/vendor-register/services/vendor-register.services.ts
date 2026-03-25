export interface VendorRegisterPayload {
  token: string;
  businessName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: Date;
  contactNumber: string;
  password: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const vendorRegisterService = {
  async register(payload: VendorRegisterPayload): Promise<APIResponse> {
    const res = await fetch('/api/vendor/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: payload.token,
        business_name: payload.businessName,
        first_name: payload.firstName,
        middle_name: payload.middleName,
        last_name: payload.lastName,
        birth_date: payload.birthDate.toISOString().split('T')[0],
        contact_number: payload.contactNumber,
        password: payload.password,
      }),
    });
    return res.json();
  },
};
