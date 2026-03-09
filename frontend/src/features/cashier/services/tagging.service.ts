export interface APIError {
  code: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// const BASE_URL = '/api/tagging';

// export const taggingService = {
//   checkUUID: async (uuid: string): Promise<APIResponse<void>> => {
//     const response = await fetch(`${BASE_URL}/check-institutional-id`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ institutionalId }),
//     });
//     return response.json();
//   },

//   checkRFID: async (rfid: string): Promise<APIResponse<void>> => {
//     const response = await fetch(`${BASE_URL}/check-institutional-id`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ institutionalId }),
//     });
//     return response.json();
//   },
// };
