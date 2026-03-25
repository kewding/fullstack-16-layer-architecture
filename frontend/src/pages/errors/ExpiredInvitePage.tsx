import { vendorInviteService } from '@/features/admin/pages/vendors/services/vendor-invite.service';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local[0] + '*'.repeat(Math.max(local.length - 2, 1)) + local[local.length - 1];
  return `${masked}@${domain}`;
}

export function ExpiredInvitePage() {
  const location = useLocation();
  const email: string = location.state?.email ?? '';

  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard — if no email in state, the user navigated here directly
  if (!email) {
    return (
      <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center px-6 max-w-sm">
          <p className="text-white text-xl font-semibold">Nothing to see here</p>
          <p className="text-neutral-400 text-sm mt-2">
            This page is only accessible via an expired invitation link.
          </p>
        </div>
      </div>
    );
  }

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    const res = await vendorInviteService.resendInvite(email);
    if (res.success) {
      setResent(true);
    } else {
      setError('Failed to resend invitation. Please contact support.');
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center px-6 max-w-sm">
        {!resent ? (
          <>
            <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
                />
              </svg>
            </div>
            <h1 className="text-white text-xl font-semibold">This invite link has expired</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              This invite link has expired for security reasons. Would you like us to send a fresh
              one to <strong className="text-white">{maskEmail(email)}</strong>?
            </p>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full bg-green-500 text-black font-bold py-3 rounded-full hover:bg-green-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Resend Invite'}
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-white text-xl font-semibold">Fresh invite sent</h1>
            <p className="text-neutral-400 text-sm">
              Check <strong className="text-white">{maskEmail(email)}</strong> for your new
              invitation link. It will be valid for 72 hours.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
