import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import type { RegisterInput } from '../schemas/register.schema';

interface SectionProps {
  form: UseFormReturn<RegisterInput>;
}

export const RegisterSectionPersonal: React.FC<SectionProps> = ({ form }) => {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col w-full gap-4">
      {/* First Name */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="firstName" className="text-sm ">
          First Name
        </label>
        <input
          id="firstName"
          type="text"
          placeholder="First Name"
          {...register('firstName')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.firstName ? 'border-red-500' : 'border-neutral-500 focus:border-white'
          } bg-neutral-900 text-white`}
        />
        {errors.firstName && (
          <span className="text-red-500 text-xs">{errors.firstName.message}</span>
        )}
      </div>

      {/* Middle Name */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="middleName" className="text-sm ">
          Middle Name
        </label>
        <input
          id="middleName"
          type="text"
          placeholder="Middle Name"
          {...register('middleName')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.middleName ? 'border-red-500' : 'border-neutral-500 focus:border-white'
          } bg-neutral-900 text-white`}
        />
        {errors.middleName && (
          <span className="text-red-500 text-xs">{errors.middleName.message}</span>
        )}
      </div>

      {/* Last Name */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="lastName" className="text-sm">
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          placeholder="Last Name"
          {...register('lastName')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.lastName ? 'border-red-500' : 'border-neutral-500 focus:border-white'
          } bg-neutral-900 text-white`}
        />
        {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
      </div>

      {/* Birth Date */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="birthDate" className="text-sm">
          Birth Date
        </label>
        <input
          id="birthDate"
          type="date"
          {...register('birthDate', { valueAsDate: true})}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.birthDate ? 'border-red-500' : 'border-neutral-500 focus:border-white'
          } bg-neutral-900 text-white`}
        />
        {errors.birthDate && (
          <span className="text-red-500 text-xs">{errors.birthDate.message}</span>
        )}
      </div>
    </div>
  );
};
