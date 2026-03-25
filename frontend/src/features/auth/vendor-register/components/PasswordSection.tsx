import React, { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type VendorRegisterInput } from '../schemas/vendor-register.schema';

interface SectionProps {
  form: UseFormReturn<VendorRegisterInput>;
  email: string;
}

export const VendorPasswordSection: React.FC<SectionProps> = ({ form, email }) => {
  const { register, formState: { errors } } = form;
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-white font-semibold text-base">Set Your Password</h2>
        <p className="text-neutral-400 text-xs">
          Your account email is <strong className="text-white">{email}</strong>
        </p>
      </div>

      {/* Password */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="password" className="text-sm">Password</label>
        <div className="flex flex-row w-full gap-0 justify-stretch">
          <input
            id="password"
            type={isVisible ? 'text' : 'password'}
            placeholder="Input Password"
            {...register('password')}
            className={`h-12 w-full p-3 rounded border focus:outline-none ${
              errors.password ? 'border-red-500' : 'border-neutral-500 focus:border-white'
            } bg-neutral-900 text-white`}
          />
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="w-20 text-xs font-bold text-neutral-400 uppercase hover:text-white select-none"
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && (
          <span className="text-red-500 text-xs">{errors.password.message}</span>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm">Confirm Password</label>
        <div className="flex flex-row w-full gap-0 justify-stretch">
          <input
            id="confirmPassword"
            type={isVisible ? 'text' : 'password'}
            placeholder="Confirm Password"
            {...register('confirmPassword')}
            className={`h-12 w-full p-3 rounded border focus:outline-none ${
              errors.confirmPassword ? 'border-red-500' : 'border-neutral-500 focus:border-white'
            } bg-neutral-900 text-white`}
          />
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="w-20 text-xs font-bold text-neutral-400 uppercase hover:text-white select-none"
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>
        )}
      </div>
    </div>
  );
};