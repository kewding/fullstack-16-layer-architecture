import { useQuery } from "@tanstack/react-query";
import { TransactionService } from "../services/transaction.service";

export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: TransactionService.getValidatedTransactions,
  });
};