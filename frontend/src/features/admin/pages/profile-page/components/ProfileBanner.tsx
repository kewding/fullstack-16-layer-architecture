interface ProfileBannerProps {
  firstName: string;
  middleName: string;
  lastName: string;
}

export function ProfileBanner({ firstName, middleName, lastName }: ProfileBannerProps) {
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase();

  return (
    <div className="w-full flex flex-col items-center gap-3 py-4">
      {/* Avatar circle */}
      <div className="w-16 h-16 rounded-full bg-[#3F6F64] flex items-center justify-center">
        <span className="text-white text-xl font-bold tracking-wide">{initials || '?'}</span>
      </div>

      {/* Name */}
      <h2 className="text-[#415B5A] font-bold text-lg text-center leading-tight">
        {fullName || '—'}
      </h2>
    </div>
  );
}
