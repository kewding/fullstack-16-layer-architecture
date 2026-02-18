import { contactSchema } from '../schemas/register.schema';

export const checkEmailAvailability = async (rawEmail: string): Promise<boolean> => {
  const isValid = contactSchema.pick({ email: true }).safeParse({ email: rawEmail });

  if (!isValid.success) {
    return false;
  }

  try {
    const response = await fetch(`/api/users/check-email?email=${isValid.data.email}`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error('Email check failed:', error);
    return false;
  }
};
