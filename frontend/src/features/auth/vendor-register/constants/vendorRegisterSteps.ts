import type { FieldPath } from 'react-hook-form';
import type { VendorRegisterInput } from '../schemas/vendor-register.schema';

export const VENDOR_REGISTER_STEPS: {
  id: string;
  fields: FieldPath<VendorRegisterInput>[];
}[] = [
  {
    id: 'business',
    fields: ['businessName'],
  },
  {
    id: 'personal',
    fields: ['firstName', 'middleName', 'lastName', 'birthDate', 'contactNumber'],
  },
  {
    id: 'security',
    fields: ['password', 'confirmPassword'],
  },
];