import z from 'zod';
import { TransactionRepository } from '../repository/transaction.repository';
import { salesTableSchema } from '../schemas/transactions.schema';

export const TransactionService = {
  async getValidatedTransactions() {
    const data = await TransactionRepository.getRawTransactions();
    // Validate the array of objects against your Zod schema
    return z.array(salesTableSchema).parse(data);
  },
};
