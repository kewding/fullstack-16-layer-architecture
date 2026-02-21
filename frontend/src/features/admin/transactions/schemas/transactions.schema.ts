import { z } from 'zod';

const SALES_TYPES = ['purchase', 'remmitance', 'topup'] as const;
const SALES_STATUSES = ['completed', 'remmited'] as const;

export const salesTableSchema = z.object({
  id: z.uuid(),
  date: z.date(),
  type: z.enum(SALES_TYPES),
  name: z.string().min(1, 'Name is required.').max(386),
  details: z.string().min(1, 'Details required.'),
  amount: z.number().positive('Amount must be greater than 0'),
  status: z.enum(SALES_STATUSES, 'Invalid status value.'),
});

export type SalesTableSchema = z.infer<typeof salesTableSchema>;
