import { MOCK_SALES } from "../constants/mockTransactions";

// This simulates the actual network request
export const fetchTransactionsFromApi = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // In production, this would be: 
  // const res = await fetch('https://api.yourdomain.com/transactions');
  // return res.json();
  
  return MOCK_SALES;
};