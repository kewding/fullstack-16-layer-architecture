import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type RegisterInput } from '../schemas/register.schema';

interface SectionProps {
  form: UseFormReturn<RegisterInput>;
}

export const RegisterSectionID: React.FC<SectionProps> = ({ form }) => {
  // RHF context from parent form
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col w-full gap-1.5">
      <label htmlFor="institutionalID" className="text-sm">
        Institutional ID
      </label>
      <input
        id="institutionalID"
        type="text"
        placeholder="Enter your institutional ID"
        {...register('institutionalID')}
        className={`h-12 p-3 rounded border focus:outline-none ${
          errors.institutionalID ? 'border-red-500' : 'border-neutral-500 focus:border-white'
        } bg-neutral-900 text-white`}
      />
      {errors.institutionalID && (
        // <p className="text-red-500 text-xs">{errors.institutionalID.message}</p>
        <span className=" text-red-500 text-xs">{errors.institutionalID.message}</span>
      )}
    </div>
  );
};
