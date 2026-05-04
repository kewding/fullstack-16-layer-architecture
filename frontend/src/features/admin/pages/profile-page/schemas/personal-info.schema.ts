import { z } from 'zod';

export const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  middle_name: z.string().min(1, 'Middle name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  birth_date: z.string().min(1, 'Birth date is required'),
  contact_number: z
    .string()
    .regex(/^09\d{9}$/, 'Must be a valid PH number e.g. 09123456789'),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;