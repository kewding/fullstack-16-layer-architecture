import React, { useEffect, useState } from 'react';
import { AccountInfoSection } from './components/AccountInfoSection';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { ProfileBanner } from './components/ProfileBanner';
import type { PersonalInfoInput } from './schemas/personal-info.schema';
import { adminInfoService } from './services/personal-info.service';

interface BannerState {
  firstName: string;
  middleName: string;
  lastName: string;
}

export const AdminProfilePage: React.FC = () => {
  const [banner, setBanner] = useState<BannerState>({
    firstName: '',
    middleName: '',
    lastName: '',
  });

  // Seed the banner on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await adminInfoService.getPersonalInfo();
        setBanner({
          firstName: data.first_name,
          middleName: data.middle_name,
          lastName: data.last_name,
        });
      } catch {
        // Banner stays empty — PersonalInfoForm will show its own fetch error
      }
    })();
  }, []);

  // Keep banner in sync after a successful save
  const handleSaveSuccess = (saved: PersonalInfoInput) => {
    setBanner({
      firstName: saved.first_name,
      middleName: saved.middle_name,
      lastName: saved.last_name,
    });
  };

  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full gap-6">
        <h1 className="text-2xl font-semibold">Profile</h1>

        {/* Banner card */}
        <div className="rounded-lg border border-[#3F6F64]/20 bg-white p-6">
          <ProfileBanner
            firstName={banner.firstName}
            middleName={banner.middleName}
            lastName={banner.lastName}
          />
        </div>

        {/* Info card */}
        <div className="rounded-lg border border-[#3F6F64]/20 bg-white p-6 flex flex-col gap-8">
          <AccountInfoSection />
          <div className="border-t border-[#3F6F64]/20" />
          <PersonalInfoForm onSaveSuccess={handleSaveSuccess} />
        </div>
      </main>
    </div>
  );
};
