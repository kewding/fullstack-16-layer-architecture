import { z } from 'zod';

export const topupSchema = z.object({
  rfid: z.string().min(8, 'RFID must be at least 8 characters.').max(64, 'RFID too long.'),
  creditAmount: z.coerce
    .number()
    .positive('Amount must be greater than zero.')
    .max(3000, 'Amount too large.'),
});

export type TopupInput = z.infer<typeof topupSchema>;    
export type TopupFormValues = z.input<typeof topupSchema>;   