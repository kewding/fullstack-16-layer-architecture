import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import { vendorInviteService } from '../services/vendor-invite.service';

interface VendorInviteModalProps {
  onClose: () => void;
  onInvited: () => void;
}

export function VendorInviteModal({ onClose, onInvited }: VendorInviteModalProps) {
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInvite = async () => {
    if (!email || !ownerName) return;
    setLoading(true);
    setError(null);

    const res = await vendorInviteService.sendInvite(email, ownerName);

    if (res.success) {
      setSuccess(true);
    } else {
      const errorMessages: Record<string, string> = {
        pending_invite_exists: 'A pending invitation already exists for this email.',
        email_already_registered: 'This email already belongs to a registered user.',
        validation_error: 'Please enter a valid email address.',
      };
      setError(errorMessages[res.error?.code ?? ''] ?? 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Invite Vendor</h2>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!success ? (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter the vendor's email address. They will receive an invitation link valid for 72
              hours.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Juan dela Cruz"
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-muted-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@company.com"
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-muted-foreground ${
                  error ? 'border-red-500/50' : ''
                }`}
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <Button
              onClick={handleInvite}
              disabled={loading || !email || !ownerName}
              className="h-10 w-full rounded-lg bg-[#3F6F64] text-white hover:bg-[#345d54]"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <p className="text-sm font-medium text-foreground">Invitation Sent</p>

            <p className="text-sm text-muted-foreground">
              An invitation email has been sent to <span className="font-semibold">{email}</span>.
            </p>

            <Button
              onClick={() => {
                onInvited();
                onClose();
              }}
              className="h-10 w-full rounded-lg bg-[#3F6F64] text-white hover:bg-[#345d54]"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
