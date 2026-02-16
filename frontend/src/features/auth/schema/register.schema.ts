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

export type InstitutionalID = z.infer<typeof institutionalIDSchema>;

export const contactSchema = z.object({
  email: z.email('Invalid email address.').trim().toLowerCase(),
  contactNumber: z
    .string()
    .trim()
    .regex(/^[0-9-]+$/, 'Please use only numbers and dashes (e.g., 0917-123-4567)')
    .transform((val) => val.replace(/-/g, ''))
    .pipe(z.string().length(11, 'The number must be exactly 11 digits.')),
});

export type ContactSchema = z.infer<typeof contactSchema>;

export const personalInfoSchema = z.object({
  firstName: z.string().trim().toLowerCase(),
  middleName: z.string().trim().toLowerCase().min(1, "Please enter middle name or check 'N/A'"),
  lastName: z.string().trim().toLowerCase(),
  birthDate: z.iso
    .date('Invalid date format.')
    .transform((val) => new Date(val))
    .pipe(
      z.date()
      .refine((date) => {
        // calculates date 4 years ago
        const fourYearsAgo = new Date();
        fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

        // checks if date is less than age requirement
        return date <= fourYearsAgo;
      }, "You must qualify the minimum age requirement.")
      .refine((date) => {
          // calculates date 60 years ago
          const sixtyYearsAgo = new Date();
          sixtyYearsAgo.setFullYear(sixtyYearsAgo.getFullYear() - 60);
          
          // checks if the birthDate is greater than 60 years old
          return date >= sixtyYearsAgo;
        }, "You must be less than 60 years old to register.")
    ),
});

export type PersonalInfoSchema = z.infer<typeof personalInfoSchema>;