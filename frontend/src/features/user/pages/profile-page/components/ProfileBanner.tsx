const ROLE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  student: { bg: 'bg-[#3F6F64]/10', text: 'text-[#3F6F64]', border: 'border-[#3F6F64]/30', label: 'Student' },
  teacher: { bg: 'bg-[#CD9A34]/10', text: 'text-[#CD9A34]', border: 'border-[#CD9A34]/30', label: 'Teacher' },
  staff: { bg: 'bg-[#415B5A]/10', text: 'text-[#415B5A]', border: 'border-[#415B5A]/30', label: 'Staff' },
};

interface ProfileBannerProps {
  firstName: string;
  middleName: string;
  lastName: string;
  customerRole: string;
}

export function ProfileBanner({
  firstName,
  middleName,
  lastName,
  customerRole,
}: ProfileBannerProps) {
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase();
  const role = ROLE_STYLES[customerRole];

  return (
    <div className="w-full flex flex-col items-center gap-3 py-4">
      {/* Avatar circle */}
      <div className="w-16 h-16 rounded-full bg-[#3F6F64] flex items-center justify-center">
        <span className="text-white text-xl font-bold tracking-wide">
          {initials || '?'}
        </span>
      </div>

      {/* Name */}
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-[#415B5A] font-bold text-lg text-center leading-tight">
          {fullName || '—'}
        </h2>

        {/* Role badge */}
        {role ? (
          <span
            className={`
              text-xs font-medium px-3 py-0.5 rounded-full border capitalize
              ${role.bg} ${role.text} ${role.border}
            `}
          >
            {role.label}
          </span>
        ) : (
          <span className="text-xs text-[#415B5A]/40 italic">No role set</span>
        )}
      </div>
    </div>
  );
}