import { fetchTransactionsFromApi } from "../api/transaction.api"; 

export const TransactionRepository = {
  getRawTransactions: () => fetchTransactionsFromApi(),
};