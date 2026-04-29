import { z } from 'zod';

export const businessInfoSchema = z.object({
  dti_sec_number: z.string().min(1, 'DTI/SEC number is required'),
  tin: z.string().min(1, 'TIN is required'),
});

export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;