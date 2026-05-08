import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type RegisterInput } from '../schemas/register.schema';

interface SectionProps {
  form: UseFormReturn<RegisterInput>;
}

export const RegisterPasswordSection: React.FC<SectionProps> = ({ form }) => {
  const {
    register,
    formState: { errors },
  } = form;

  // const [isVisible, setIsVisible] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Password Field */}
      <div className="flex flex-col w-full gap-1.5">
        <label htmlFor="password" title="Password" className="text-sm">
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
            errors.confirmPassword
              ? 'border-red-500'
              : 'border focus-within:border-[#CD9A34]'
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

  // return (
  //   <div className="flex flex-col w-full gap-4">
  //     {/* password */}
  //     <div className="flex flex-col w-full gap-1.5">
  //       <label htmlFor="password" className="text-sm">
  //         Password
  //       </label>
  //       {/* input and show password */}
  //       <div className="flex flex-row w-full gap-0 justify-stretch">
  //         <input
  //           id="password"
  //           type={showPassword ? 'text' : 'password'}
  //           placeholder="Input Password"
  //           {...register('password')}
  //           className={`h-12 w-full p-3 rounded border focus:outline-none ${
  //             errors.password ? 'border-red-500' : 'border-neutral-500 focus:border-[#CD9A34]'
  //           }  text-[#3F6F64]`}
  //         />

  //         <button
  //           type="button"
  //           onClick={() => setShowPassword(!showPassword)}
  //           className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#3F6F64]"
  //         >
  //           {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //         </button>
  //       </div>

  //       {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
  //     </div>

  //     {/* confirm password */}
  //     <div className="flex flex-col w-full gap-1.5">
  //       <label htmlFor="confirmPassword" className="text-sm">
  //         Confirm Password
  //       </label>

  //       <div className="flex flex-row w-full gap-0 justify-stretch">
  //         <input
  //           id="confirmPassword"
  //           type={showConfirmPassword ? 'text' : 'password'}
  //           placeholder="Confirm Password"
  //           {...register('confirmPassword')}
  //           className={`h-12 w-full p-3 rounded border focus:outline-none ${
  //             errors.confirmPassword
  //               ? 'border-red-500'
  //               : 'border-neutral-500 focus:border-[#CD9A34]'
  //           } bg-neutral-900 text-[#3F6F64]`}
  //         />

  //         <button
  //           type="button"
  //           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  //           className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#3F6F64]"
  //         >
  //           {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  //         </button>
  //       </div>

  //       {errors.confirmPassword && (
  //         <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>
  //       )}
  //     </div>
  //   </div>
  // );
};
