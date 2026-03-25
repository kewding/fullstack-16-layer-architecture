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
      <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          <p className="text-neutral-400 text-sm">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center px-6 max-w-sm">
          <p className="text-white text-xl font-semibold">Invalid invitation link</p>
          <p className="text-neutral-400 text-sm mt-2">
            This link is invalid or does not exist. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return <VendorRegisterForm email={inviteData!.email} token={inviteData!.token} />;
}
