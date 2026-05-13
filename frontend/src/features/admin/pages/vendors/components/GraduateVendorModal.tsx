import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { vendorService } from '../services/vendor.service';

interface GraduateVendorModalProps {
  vendorID: string;
  stallName: string;
  walletBalance: number;
  onClose: () => void;
  onGraduated: () => void;
}

const GRADUATE_REASONS = [
  { value: 'wrong_invite', label: 'Wrong Invite' },
  { value: 'terminated_contract', label: 'Terminated Contract' },
  { value: 'insufficient_credentials', label: 'Insufficient Credentials' },
  { value: 'others', label: 'Others' },
] as const;

const formatPHP = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export function GraduateVendorModal({
  vendorID,
  stallName,
  walletBalance,
  onClose,
  onGraduated,
}: GraduateVendorModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletIsNotZero = walletBalance !== 0;

  const toggleReason = (value: string) => {
    setSelectedReasons((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );
  };

  const showOtherInput = selectedReasons.includes('others');

  const canSubmit =
    !walletIsNotZero &&
    selectedReasons.length > 0 &&
    (!showOtherInput || otherReason.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await vendorService.graduateVendor(vendorID, selectedReasons, otherReason);

      if (res.success) {
        onGraduated();
        onClose();
      } else {
        if (res.error?.code === 'wallet_not_zero') {
          setError(
            'This vendor still has a balance. They must withdraw or remit before being removed.',
          );
        } else {
          setError(res.error?.message ?? 'Failed to remove vendor from business.');
        }
      }
    } catch {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Remove Vendor from Business
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{stallName}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {walletIsNotZero ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-600">Wallet Balance Must Be Zero</p>

              <p className="mt-2 text-sm text-red-600/90">
                This vendor currently has a balance of{' '}
                <span className="font-bold">{formatPHP(walletBalance)}</span>.
              </p>

              <p className="mt-2 text-xs text-red-600/80">
                They must withdraw or remit their wallet balance before they can be removed.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This will permanently archive <span className="font-semibold">{stallName}</span> as
                a former vendor. Please select the reason(s).
              </p>

              <div className="flex flex-col gap-2">
                {GRADUATE_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`
                      flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors
                      ${
                        selectedReasons.includes(reason.value)
                          ? 'border-[#3F6F64]/40 bg-[#3F6F64]/10 text-[#3F6F64]'
                          : 'border-border bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason.value)}
                      onChange={() => toggleReason(reason.value)}
                      className="h-4 w-4 accent-[#3F6F64]"
                    />
                    {reason.label}
                  </label>
                ))}
              </div>

              {showOtherInput && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Please specify
                  </label>

                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Describe the reason..."
                    rows={3}
                    className="w-full resize-none rounded-xl border bg-white p-3 text-sm text-foreground outline-none focus:border-muted-foreground"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-6 py-5">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-lg"
          >
            {walletIsNotZero ? 'Close' : 'Cancel'}
          </Button>

          {!walletIsNotZero && (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-500"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Confirm Remove'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}