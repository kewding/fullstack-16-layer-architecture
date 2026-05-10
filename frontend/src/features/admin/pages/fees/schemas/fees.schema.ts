import { z } from 'zod';

export const feeSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(parseFloat(v)), { message: 'Must be a valid number' })
    .refine((v) => parseFloat(v) >= 0, { message: 'Amount must be zero or positive' })
    .refine((v) => /^\d+(\.\d{0,2})?$/.test(v), {
      message: 'Maximum 2 decimal places allowed',
    }),
});

export type FeeInput = z.infer<typeof feeSchema>;