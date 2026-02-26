import { z } from 'zod';

export const institutionalIDSchema = z.object({
  institutionalId: z
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
  birthDate: z.coerce
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
    }, 'You must be less than 60 years old to register.')
    // Access the first element [0] to return a string, not an array
    .transform((date) => date.toISOString().split('T')[0]),
    
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

const passwordObject = z
  .object({
    password: z.string()
  .min(8, 'Minimum 8 characters')
  .max(64, 'Maximum 64 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(), // Removed invalid .omit()
  })

export const passwordSchema = passwordObject.refine(
  (data) => data.password === data.confirmPassword, 
  { message: "Passwords don't match", path: ['confirmPassword'] }
);

export const registerSchema = z.object({
  ...institutionalIDSchema.shape,
  ...contactSchema.shape,
  ...personalInfoSchema.shape,
  ...passwordObject.shape, // Use passwordObject here, NOT passwordSchema
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterInput = z.input<typeof registerSchema>;
// export type RegisterOutput = z.output<typeof registerSchema>;
export type RegisterOutput = z.output<typeof registerSchema>;
