import { z } from 'zod';

export const userProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),

  middle_name: z.string().min(1, 'Middle name is required').max(100, 'Middle name is too long'),

  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),

  birth_date: z
    .string()
    .min(1, 'Birth date is required')
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),

  contact_number: z
    .string()
    .min(1, 'Contact number is required')
    .regex(/^09\d{9}$/, 'Contact number must be a valid PH number e.g. 09123456789'),

  customer_role: z.enum(['student', 'teacher', 'staff'], {
    error: 'Please select your role',
  }),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
