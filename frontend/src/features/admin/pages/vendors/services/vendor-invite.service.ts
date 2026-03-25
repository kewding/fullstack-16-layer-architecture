export interface ValidateTokenData {
  email: string;
  token: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const vendorInviteService = {
  async sendInvite(email: string): Promise<APIResponse> {
    const res = await fetch('/api/admin/vendor/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async validateToken(token: string): Promise<APIResponse<ValidateTokenData>> {
    const res = await fetch(`/api/vendor/invite/validate?token=${token}`);
    return res.json();
  },

  async resendInvite(email: string): Promise<APIResponse> {
    const res = await fetch('/api/vendor/invite/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },
};
