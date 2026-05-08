import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type VendorRegisterInput } from '../schemas/vendor-register.schema';

interface SectionProps {
  form: UseFormReturn<VendorRegisterInput>;
  email: string;
}

export const VendorPasswordSection: React.FC<SectionProps> = ({ form, email }) => {
  const {
    register,
    formState: { errors },
  } = form;
  // const [isVisible, setIsVisible] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex flex-col w-full gap-4">
      <div></div>
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-[#415B5A] text-base">Set Your Password</h2>
        <p className="text-[#415B5A] text-xs">
          Your account email is <strong className="text-[#CD9A34]">{email}</strong>
        </p>
      </div>

      {/* Password */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="password" className="text-sm">
          Password
        </label>
        {/* INPUT GROUP CONTAINER: This div now handles the border and height */}
        <div
          className={`flex items-center h-12 w-full rounded border bg-transparent transition-colors ${
            errors.password ? 'border-red-500' : 'border focus-within:border-[#CD9A34]'
          }`}
        >
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Input Password"
            {...register('password')}
            // Removed individual border/focus; added bg-transparent and outline-none
            className="flex-grow h-full p-3 bg-transparent outline-none text-[#3F6F64]"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            // Removed absolute positioning; using padding and focus:outline-none
            className="px-3 bg-transparent border-none text-[#3F6F64] hover:text-[#CD9A34] transition-colors focus:outline-none"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>

        {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
      </div>

      {/* Confirm Password Field */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="confirmPassword" title="Confirm Password" className="text-sm">
          Confirm Password
        </label>

        {/* INPUT GROUP CONTAINER */}
        <div
          className={`flex items-center h-12 w-full rounded border bg-transparent transition-colors ${
            errors.confirmPassword ? 'border-red-500' : 'border focus-within:border-[#CD9A34]'
          }`}
        >
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            {...register('confirmPassword')}
            // Removed bg-neutral-900 to ensure transparency within the group
            className="flex-grow h-full p-3 bg-transparent outline-none text-[#3F6F64]"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="px-3 bg-transparent border-none text-[#3F6F64] hover:text-[#CD9A34] transition-colors focus:outline-none"
          >
            {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>

        {errors.confirmPassword && (
          <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>
        )}
      </div>
    </div>
  );
};
