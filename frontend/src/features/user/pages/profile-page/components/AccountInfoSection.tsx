import { useEffect, useState } from 'react';
import { userProfileService } from '../services/profile.service';

const INPUT_BASE =
  'h-12 w-full bg-transparent text-[#3F6F64] border border-[#3F6F64] rounded px-3 ' +
  'focus:outline-none transition-colors opacity-60 cursor-not-allowed';

export function AccountInfoSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await userProfileService.getProfile();
        setEmail(data.email);
      } catch {
        setError('Failed to load account information.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Section label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-[#415B5A]/50">
        Account Information
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-[#415B5A]/50 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-[#3F6F64] border-t-transparent animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <p className="text-red-500 text-xs">{error}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#415B5A] font-normal">Email</label>
          <input type="email" value={email} disabled readOnly className={INPUT_BASE} />
          <span className="text-[#415B5A]/40 text-xs">Email cannot be changed.</span>
        </div>
      )}
    </div>
  );
}
