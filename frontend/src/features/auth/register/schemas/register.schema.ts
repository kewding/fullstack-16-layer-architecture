import { z } from 'zod';

export const institutionalIDSchema = z.object({
  institutionalID: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[0-9a-z-]+$/, 'Invalid characters.')
    .transform((val) => val.replace(/-/g, ''))
    .pipe(z.string().min(6, 'ID must be at least 6 characters.').max(32, 'ID is too long.')),
});

export type InstitutionalIDInput = z.infer<typeof institutionalIDSchema>;

export const contactSchema = z.object({
  email: z.email('Invalid email format.').trim().toLowerCase(),
  contactNumber: z
    .string()
    .trim()
    .regex(/^[0-9-]+$/, 'Please use only numbers and dashes (e.g., 0917-123-4567)')
    .transform((val) => val.replace(/-/g, ''))
    .pipe(z.string().length(11, 'The number must be exactly 11 digits.')),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const personalInfoSchema = z.object({
  firstName: z.string().trim().toLowerCase().nonempty('Required').max(128, 'First name too long.'),
  middleName: z
    .string()
    .trim()
    .nonempty("Please enter middle name or check 'N/A'")
    .toLowerCase()
    .max(128, 'Middle name too long.'),
  lastName: z.string().trim().toLowerCase().nonempty('Required').max(128, 'Last name too long'),
  birthDate: z
    .date('Invalid date format.')
    .refine((date) => {
      const fourYearsAgo = new Date();
      fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
      return date <= fourYearsAgo;
    }, 'You must qualify the minimum age requirement.')
    .refine((date) => {
      const sixtyYearsAgo = new Date();
      sixtyYearsAgo.setFullYear(sixtyYearsAgo.getFullYear() - 60);
      return date >= sixtyYearsAgo;
    }, 'You must be less than 60 years old to register.'),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password too long')
      // one uppercase letter
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      // one lowercase letter
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      // one number
      .regex(/[0-9]/, 'Password must contain at least one number')
      // one special character
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // ensures the error is attached to confirmPassword
  });

export type PasswordInput = z.infer<typeof passwordSchema>;

export const registerSchema = z.object({
  ...institutionalIDSchema.shape,
  ...contactSchema.shape,
  ...personalInfoSchema.shape,
  ...passwordSchema.shape,
});

export type RegisterInput = z.infer<typeof registerSchema>;
// export type RegisterOutput = z.output<typeof registerSchema>;
