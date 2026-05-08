import { Calendar } from 'lucide-react';
import React, { useRef } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type VendorRegisterInput } from '../schemas/vendor-register.schema';

interface SectionProps {
  form: UseFormReturn<VendorRegisterInput>;
}

export const VendorPersonalSection: React.FC<SectionProps> = ({ form }) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const dateInputRef = useRef<HTMLInputElement>(null);
  const middleNameValue = watch('middleName');
  const isNA = middleNameValue === 'N/A';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setValue('middleName', 'N/A', { shouldValidate: true });
    } else {
      setValue('middleName', '');
    }
  };

  const { ref: hookFormRef, ...birthDateProps } = register('birthDate', { valueAsDate: true });

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-[#415B5A] text-base">Owner Information</h2>
        <p className="text-[#415B5A] text-xs">Personal details of the business owner.</p>
      </div>

      {/* First Name */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="firstName" className="text-sm">
          First Name
        </label>
        <input
          id="firstName"
          type="text"
          placeholder="First Name"
          {...register('firstName')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.firstName ? 'border-red-500' : 'border focus:border-[#CD9A34]'
          } text-[#3F6F64]`}
        />
        {errors.firstName && (
          <span className="text-red-500 text-xs">{errors.firstName.message}</span>
        )}
      </div>

      {/* Middle Name */}
      <div className="flex flex-col w-full gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm">Middle Name</label>

          <label className="flex items-center gap-2 cursor-pointer bg-transparent">
            <span className="text-[11px] text-neutral-500">I don't have one</span>
            <input
              type="checkbox"
              checked={isNA}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded border bg-transparent text-gray-400"
            />
          </label>
        </div>
        <input
          {...register('middleName')}
          readOnly={isNA}
          placeholder={isNA ? 'N/A' : 'Middle Name'}
          className={`h-12 p-3 rounded border focus:outline-none transition-all ${
            errors.middleName ? 'border-red-500' : 'border focus:border-[#CD9A34]'
          } ${isNA ? 'text-neutral-500 cursor-not-allowed' : 'text-[#3F6F64]'}`}
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
            errors.lastName ? 'border-red-500' : 'border focus:border-[#CD9A34]'
          } text-[#3F6F64]`}
        />
        {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
      </div>

      {/* Birth Date */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="birthDate" className="text-sm">
          Birth Date
        </label>

        {/* INPUT GROUP CONTAINER */}
        <div
          className={`flex items-center h-12 w-full rounded border bg-transparent transition-colors ${
            errors.birthDate ? 'border-red-500' : 'border-neutral-500 focus-within:border-[#CD9A34]'
          }`}
        >
          <input
            id="birthDate"
            type="date"
            {...birthDateProps}
            // Merged Ref logic to support both Hook Form and manual picker trigger
            ref={(e) => {
              hookFormRef(e);
              dateInputRef.current = e;
            }}
            // 1. flex-grow and h-full ensure it takes up the available space
            // 2. [&::-webkit...]:hidden removes the native browser calendar icon
            className="flex-grow h-full p-3 bg-transparent outline-none text-[#3F6F64] 
                     [&::-webkit-calendar-picker-indicator]:appearance-none 
                     [&::-webkit-calendar-picker-indicator]:hidden"
          />

          {/* Custom Calendar Icon button */}
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker()}
            className="px-3 bg-transparent border-none text-[#3F6F64] hover:text-[#CD9A34] transition-colors focus:outline-none"
            aria-label="Open calendar"
          >
            <Calendar size={18} />
          </button>
        </div>

        {/* Error Message */}
        {errors.birthDate && (
          <span className="text-red-500 text-xs mt-1">{errors.birthDate.message}</span>
        )}
      </div>

      {/* Contact Number */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="contactNumber" className="text-sm">
          Contact Number
        </label>
        <input
          id="contactNumber"
          type="tel"
          placeholder="09123456789"
          {...register('contactNumber')}
          className={`h-12 p-3 rounded border focus:outline-none ${
            errors.contactNumber ? 'border-red-500' : 'focus:border-[#CD9A34]'
          }  text-[#3F6F64]`}
        />
        {errors.contactNumber && (
          <span className="text-red-500 text-xs">{errors.contactNumber.message}</span>
        )}
      </div>
    </div>
  );
};
