import type { FieldPath } from 'react-hook-form';
import type { RegisterInput } from '../schemas/register.schema';

export const REGISTER_STEPS: FieldPath<RegisterInput>[][] = [
  ['institutionalID'],
  ['email', 'contactNumber'],
  ['firstName', 'middleName', 'lastName', 'birthDate'],
];
