import { z } from 'zod';

export const topupSchema = z.object({
  rfid: z.string().min(8, 'RFID must be at least 8 characters.').max(64, 'RFID too long.'),
  creditAmount: z
    .number()
    .positive('Amount must be greater than zero.')
    .max(999999999999.99, 'Amount too large.'),
});

export type TopupInput = z.infer<typeof topupSchema>;
