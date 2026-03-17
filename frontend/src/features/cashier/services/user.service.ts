export interface UserData {
  user_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
}

export const userService = {
  async getUserById(userID: string): Promise<UserData> {
    const res = await fetch(`/api/user/${userID}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message ?? 'Failed to fetch user');
    return json.data as UserData;
  },
};
