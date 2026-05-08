import {
  vendorInviteService,
  type ValidateTokenData,
} from '@/features/admin/pages/vendors/services/vendor-invite.service';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VendorRegisterForm } from './components/RegisterForm';

export function VendorRegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [inviteData, setInviteData] = useState<ValidateTokenData | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const validate = async () => {
      const res = await vendorInviteService.validateToken(token);

      if (res.success && res.data) {
        setInviteData(res.data);
        setStatus('valid');
      } else if (res.error?.code === 'invite_expired' || res.error?.code === 'invite_used') {
        navigate('/expired-invitation', {
          replace: true,
          state: { email: res.data?.email ?? '' }, // ← now populated from backend
        });
      } else {
        setStatus('invalid');
      }
    };

    validate();
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#E9F4F1]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#CD9A34] border-t-[#3F6F64] animate-spin" />
          <p className="text-[#3F6F64] text-sm font-medium">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="w-screen h-screen flex items-center justify-center  bg-[#E9F4F1]">
        <div className="text-center px-6 max-w-sm">
          <p className="text-[#3F6F64] text-xl font-bold">Invalid invitation link</p>
          <p className="text-[#415B5A] text-sm">
            This link is invalid or does not exist. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center  bg-[#E9F4F1]">
      <VendorRegisterForm email={inviteData!.email} token={inviteData!.token} />
    </div>
  );
}
