import { useAuth } from '@/app/providers/AuthProvider';
import { vendorInfoService } from '../../services/vendor-info.service';
import React, { useEffect, useState } from 'react';

const now = new Date();
const localFormattedDate = now.toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const VendorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    // use firstName from AuthProvider if available (set on /api/auth/me)
    // AuthProvider already fetches first_name via checkSession
    if (user?.firstName) {
      setFirstName(user.firstName);
      return;
    }

    // fallback: fetch from personal info endpoint
    vendorInfoService.getPersonalInfo()
      .then(data => setFirstName(data.first_name))
      .catch(() => {});
  }, [user?.firstName]);

  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full h-full gap-3">
        <div className="flex flex-col w-full gap-0">
          <h1 className="text-2xl font-semibold">
            Hello, {firstName || 'Vendor'}
          </h1>
          <span className="text-sm">{localFormattedDate}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-1">
            {/* undecided components */}
          </div>
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* unknown content */}
          </div>
        </div>
      </main>
    </div>
  );
};