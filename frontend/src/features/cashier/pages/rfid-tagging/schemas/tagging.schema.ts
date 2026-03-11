import { z } from 'zod';

export const taggingSchema = z.object({
  uuid: z.uuid('Please enter a valid UUID.'),
  rfid: z.string().min(6, 'RFID must be at least 6 characters.').max(64, 'RFID too long'),
});

export type TaggingInput = z.infer<typeof taggingSchema>;
