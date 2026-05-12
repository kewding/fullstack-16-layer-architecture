import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
          setError(res.error?.message ?? 'Failed to remove vendor from business');
        }
      }
    } catch {
      setError('A network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold">Remove Vendor from Business</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{stallName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:text-[#415B5A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {/* Wallet balance warning */}
          {walletIsNotZero ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/40 p-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-red-400">Wallet Balance Must Be Zero</p>
              <p className="text-sm text-red-300">
                This vendor currently has a balance of{' '}
                <span className="font-bold">{formatPHP(walletBalance)}</span>. Before removing them
                from business, they must either:
              </p>
              <ul className="list-disc list-inside text-sm text-red-300 space-y-1 pl-1">
                <li>Submit a remittance request to withdraw their balance, or</li>
                <li>Have the balance settled by the admin.</li>
              </ul>
              <p className="text-xs text-red-400 mt-1">
                This action cannot proceed until the wallet balance is{' '}
                <span className="font-bold">₱0.00</span>.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                This will permanently archive{' '}
                <span className="font-semibold text-white">{stallName}</span> as a former vendor.
                The vendor's account will be deactivated. Please select the reason(s).
              </p>

              <div className="flex flex-col gap-2">
                {GRADUATE_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex items-center gap-3 cursor-pointer rounded-lg border border-neutral-700 px-4 py-3 hover:border-[#3F6F64] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason.value)}
                      onChange={() => toggleReason(reason.value)}
                      className="w-4 h-4 accent-[#3F6F64]"
                    />
                    <span className="text-sm">{reason.label}</span>
                  </label>
                ))}
              </div>

              {showOtherInput && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted-foreground">Please specify</label>
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Describe the reason..."
                    rows={3}
                    className="w-full bg-transparent border border-neutral-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#3F6F64] resize-none placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-neutral-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {walletIsNotZero ? 'Close' : 'Cancel'}
          </Button>
          {!walletIsNotZero && (
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
            >
              {loading ? 'Processing...' : 'Confirm Remove'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}