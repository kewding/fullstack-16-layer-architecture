export interface UserData {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
}

export interface WalletData {
  balance: number;
  last_topup_amount: number | null;
  last_topup_date: string | null;
}

export const userService = {
  async getUserById(userID: string): Promise<UserData> {
    const res = await fetch(`/api/customer/user/info/${userID}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch user');
    return json.data as UserData;
  },

  async getWallet(userID: string): Promise<WalletData> {
    const res = await fetch(`/api/customer/user/wallet/${userID}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch wallet');
    return json.data as WalletData;
  },
};
