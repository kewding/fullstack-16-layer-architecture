import { z } from 'zod';

export const vendorRegisterSchema = z
  .object({
    // Step 1 — Business Info
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255),

    // Step 2 — Personal Info
    firstName: z.string().min(1, 'First name is required').max(100),
    middleName: z.string().min(1, 'Middle name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    birthDate: z.date({ error: 'Birth date is required' }),
    contactNumber: z
      .string()
      .regex(/^09\d{9}$/, 'Contact number must be a valid PH number e.g. 09123456789'),

    // Step 3 — Security
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;
