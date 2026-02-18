import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import type { RegisterInput } from '../schemas/register.schema';

interface SectionProps {
  form: UseFormReturn<RegisterInput>;
}

export const RegisterSectionContact: React.FC<SectionProps> = ({ form }) => {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Email Field */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="email" className="text-sm">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="name@domain.com"
          {...register('email')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.email ? 'border-red-500' : 'border-neutral-500 focus:border-white'
          } bg-neutral-900 text-white`}
        />
        {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
      </div>

      {/* Contact Number Field */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="contactNumber" className="text-sm">
          Contact Number
        </label>
        <input
          id="contactNumber"
          type="tel"
          placeholder="0912-345-6789"
          {...register('contactNumber')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.contactNumber ? 'border-red-500' : 'border-neutral-500 focus:border-white'
          } bg-neutral-900 text-white`}
        />
        {errors.contactNumber && (
          <span className="text-red-500 text-xs">{errors.contactNumber.message}</span>
        )}
      </div>
    </div>
  );
};
