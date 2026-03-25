import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type VendorRegisterInput } from '../schemas/vendor-register.schema';

interface SectionProps {
  form: UseFormReturn<VendorRegisterInput>;
}

export const VendorBusinessSection: React.FC<SectionProps> = ({ form }) => {
  const { register, formState: { errors } } = form;

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-white font-semibold text-base">Business Information</h2>
        <p className="text-neutral-400 text-xs">Tell us about your business.</p>
      </div>

      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="businessName" className="text-sm">
          Business Name
        </label>
        <input
          id="businessName"
          type="text"
          placeholder="e.g. Juan's Canteen"
          {...register('businessName')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.businessName ? 'border-red-500' : 'border-neutral-500 focus:border-white'
          } bg-neutral-900 text-white`}
        />
        {errors.businessName && (
          <span className="text-red-500 text-xs">{errors.businessName.message}</span>
        )}
      </div>
    </div>
  );
};