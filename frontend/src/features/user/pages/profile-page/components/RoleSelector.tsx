import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { UserProfileInput } from '../schemas/profile.schema';

const ROLES = [
  { value: 'student', activeClass: 'bg-[#3F6F64] border-[#3F6F64] text-white' },
  { value: 'teacher', activeClass: 'bg-[#CD9A34] border-[#CD9A34] text-white' },
  { value: 'staff', activeClass: 'bg-[#415B5A] border-[#415B5A] text-white' },
] as const;

const IDLE_CLASS =
  'bg-transparent border-[#3F6F64] text-[#415B5A] hover:border-[#CD9A34] hover:text-[#CD9A34]';

interface RoleSelectorProps {
  setValue: UseFormSetValue<UserProfileInput>;
  watch: UseFormWatch<UserProfileInput>;
  error?: string;
}

export function RoleSelector({ setValue, watch, error }: RoleSelectorProps) {
  const selected = watch('customer_role');

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-[#415B5A] font-normal">I am a…</label>

      <div className="flex gap-3 flex-wrap">
        {ROLES.map(({ value, activeClass }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue('customer_role', value, { shouldValidate: true })}
            className={`
              h-12 flex-1 min-w-[90px] rounded border font-medium text-sm capitalize
              transition-all duration-150
              ${selected === value ? activeClass : IDLE_CLASS}
            `}
          >
            {value}
          </button>
        ))}
      </div>

      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
