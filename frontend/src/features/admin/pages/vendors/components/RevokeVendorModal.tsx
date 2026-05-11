import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useState } from 'react';
import { vendorService } from '../services/vendor.service';

interface RevokeVendorModalProps {
  vendorID: string;
  vendorEmail: string;
  onClose: () => void;
  onRevoked: () => void;
}

const REVOKE_REASONS = [
  { value: 'wrong_invite', label: 'Wrong Invite' },
  { value: 'did_not_proceed', label: 'Did Not Proceed' },
  { value: 'others', label: 'Others' },
] as const;

export function RevokeVendorModal({
  vendorID,
  vendorEmail,
  onClose,
  onRevoked,
}: RevokeVendorModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleReason = (value: string) => {
    setSelectedReasons((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );
  };

  const showOtherInput = selectedReasons.includes('others');

  const canSubmit =
    selectedReasons.length > 0 && (!showOtherInput || otherReason.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await vendorService.revokeVendorWithReason(
        vendorID,
        selectedReasons,
        otherReason,
      );
      if (res.success) {
        onRevoked();
        onClose();
      } else {
        setError(res.error?.message ?? 'Failed to revoke vendor');
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
            <h2 className="text-lg font-semibold">Remove Vendor</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{vendorEmail}</p>
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
          <p className="text-sm text-muted-foreground">
            Please select the reason(s) for removing this vendor. This will be recorded for audit
            purposes.
          </p>

          <div className="flex flex-col gap-2">
            {REVOKE_REASONS.map((reason) => (
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

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-neutral-800">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? 'Removing...' : 'Confirm Remove'}
          </Button>
        </div>
      </div>
    </div>
  );
}