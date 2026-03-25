import { Button } from '@/components/ui/button';
import { vendorInviteService } from '../services/vendor-invite.service';
import { X } from 'lucide-react';
import { useState } from 'react';

interface VendorInviteModalProps {
  onClose: () => void;
}

export function VendorInviteModal({ onClose }: VendorInviteModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    const res = await vendorInviteService.sendInvite(email);

    if (res.success) {
      setSuccess(true);
    } else {
      const errorMessages: Record<string, string> = {
        pending_invite_exists: 'A pending invitation already exists for this email.',
        validation_error: 'Please enter a valid email address.',
      };
      setError(errorMessages[res.error?.code ?? ''] ?? 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Invite Vendor</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!success ? (
          <>
            <p className="text-sm text-neutral-400">
              Enter the vendor's email address. They will receive a formal invitation with a
              registration link valid for 72 hours.
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="vendor-email" className="text-sm text-white">
                Email Address
              </label>
              <input
                id="vendor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@company.com"
                className={`h-12 bg-neutral-800 border rounded p-3 text-white focus:outline-none transition-colors ${
                  error ? 'border-red-500' : 'border-neutral-600 focus:border-white'
                }`}
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>

            <Button
              onClick={handleInvite}
              disabled={loading || !email}
              className="w-full bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-medium">Invitation Sent</p>
            <p className="text-neutral-400 text-sm">
              An invitation email has been sent to <strong className="text-white">{email}</strong>.
              The link will expire in 72 hours.
            </p>
            <Button
              onClick={onClose}
              className="w-full bg-white text-black font-semibold rounded-xl hover:bg-neutral-200"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}