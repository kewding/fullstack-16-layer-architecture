import { z } from 'zod';

export const transactionTypeFilterSchema = z.enum(['', 'purchase', 'top-up', 'withdraw']);
export type TransactionTypeFilter = z.infer<typeof transactionTypeFilterSchema>;

export const dateRangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().or(z.literal('')),
    to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().or(z.literal('')),
  })
  .refine(
    (v) => {
      if (v.from && v.to) return v.from <= v.to;
      return true;
    },
    { message: '"From" date must not be after "To" date', path: ['from'] },
  );

export const transactionListParamsSchema = z
  .object({
    type: transactionTypeFilterSchema.default(''),
    page: z.number().int().positive().default(1),
  })
  .merge(dateRangeSchema);

export type TransactionListParams = z.infer<typeof transactionListParamsSchema>;