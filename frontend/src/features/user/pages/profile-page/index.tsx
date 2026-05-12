import { useEffect, useState } from 'react';
import { AccountInfoSection } from './components/AccountInfoSection';
import { ProfileBanner } from './components/ProfileBanner';
import type { UserProfileInput } from './schemas/profile.schema';
import { PersonalInfoForm } from './components/PersonalInforForm';
import { userProfileService } from './services/profile.service';

//info
interface BannerState {
  firstName: string;
  middleName: string;
  lastName: string;
  customerRole: string;
}

export const UserProfilePage: React.FC = () => {
  const [banner, setBanner] = useState<BannerState>({
    firstName: '',
    middleName: '',
    lastName: '',
    customerRole: '',
  });

  // Fetch once on mount to seed the banner
  useEffect(() => {
    (async () => {
      try {
        const data = await userProfileService.getProfile();
        setBanner({
          firstName: data.first_name,
          middleName: data.middle_name,
          lastName: data.last_name,
          customerRole: data.customer_role,
        });
      } catch {
        // Banner stays empty — PersonalInfoForm will show its own fetch error
      }
    })();
  }, []);

  // PersonalInfoForm calls this after a successful save so the banner stays in sync
  const handleSaveSuccess = (saved: UserProfileInput) => {
    setBanner({
      firstName: saved.first_name,
      middleName: saved.middle_name,
      lastName: saved.last_name,
      customerRole: saved.customer_role,
    });
  };

  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full gap-6">

        <h1 className="text-2xl font-semibold">Profile</h1>

        {/* Banner card */}
        <div className="rounded-lg border border-[#3F6F64]/20 bg-[#E9F4F1] p-6">
          <ProfileBanner
            firstName={banner.firstName}
            middleName={banner.middleName}
            lastName={banner.lastName}
            customerRole={banner.customerRole}
          />
        </div>

        {/* Info card */}
        <div className="rounded-lg border border-[#3F6F64]/20 bg-[#E9F4F1] p-6 flex flex-col gap-8">
          <AccountInfoSection />
          <div className="border-t border-[#3F6F64]/20" />
          <PersonalInfoForm onSaveSuccess={handleSaveSuccess} />
        </div>

      </main>
    </div>
  );
};