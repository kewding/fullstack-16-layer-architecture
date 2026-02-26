import type { FieldPath } from 'react-hook-form';
import type { RegisterInput } from '../schemas/register.schema';

export type RegisterStepConfig = {
  id: string;
  fields: FieldPath<RegisterInput>[];
}

export const REGISTER_STEPS: RegisterStepConfig[] = [
  { id: 'id-section', fields: ['institutionalId'] },
  { id: 'contact', fields: ['email', 'contactNumber'] },
  { id: 'personal', fields: ['firstName', 'middleName', 'lastName', 'birthDate'] },
  { id: 'security', fields: ['password', 'confirmPassword'] },
];