import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { vendorService, type VendorDetailResponse } from '../services/vendor.service';

interface VendorDetailModalProps {
  vendorID: string;
  onClose: () => void;
  onApproved: () => void;
  onRemoved: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-white">{value || '—'}</span>
    </div>
  );
}

function DocumentRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 underline hover:text-blue-300"
        >
          View PDF
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">Not uploaded</span>
      )}
    </div>
  );
}

export function VendorDetailModal({
  vendorID,
  onClose,
  onApproved,
  onRemoved,
}: VendorDetailModalProps) {
  const [vendor, setVendor] = useState<VendorDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await vendorService.getVendorDetail(vendorID);
        setVendor(data);
      } catch {
        setError('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorID]);

  const handleApprove = async () => {
    if (!vendor) return;
    setApproving(true);
    try {
      const res = await vendorService.approveVendor(vendorID);
      if (res.success) {
        onApproved();
        onClose();
      } else {
        setError(res.error?.message ?? 'Failed to approve vendor');
      }
    } catch {
      setError('A network error occurred');
    } finally {
      setApproving(false);
    }
  };

  const handleRemove = async () => {
    if (!vendor) return;
    setRemoving(true);
    try {
      const res = await vendorService.removeFromBusiness(vendorID);
      if (res.success) {
        onRemoved();
        onClose();
      } else {
        setError(res.error?.message ?? 'Failed to remove vendor from business');
      }
    } catch {
      setError('A network error occurred');
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold">Vendor Review</h2>
            {vendor && <p className="text-sm text-muted-foreground">{vendor.email}</p>}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Loading vendor details...
          </div>
        ) : error ? (
          <div className="p-6 text-red-500 text-sm">{error}</div>
        ) : vendor ? (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold border-b border-neutral-800 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="First Name" value={vendor.first_name} />
                <InfoRow label="Last Name" value={vendor.last_name} />
                <InfoRow label="Middle Name" value={vendor.middle_name} />
                <InfoRow label="Birth Date" value={vendor.birth_date} />
                <InfoRow label="Contact Number" value={vendor.contact_number} />
                <InfoRow label="Stall / Business Name" value={vendor.stall_name} />
              </div>
            </div>

            {/* Business Information */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold border-b border-neutral-800 pb-2">
                Business Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">DTI BNRS / SEC Number</span>
                    {vendor.is_dti_verified && (
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-white">{vendor.dti_sec_number || '—'}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">TIN</span>
                    {vendor.is_tin_verified && (
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-white">{vendor.tin || '—'}</span>
                </div>

                {/* Documents */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Supporting Documents</span>
                    {vendor.is_documents_verified && (
                      <Badge variant="default" className="text-xs">
                        All Verified
                      </Badge>
                    )}
                  </div>
                  <DocumentRow
                    label="Proof of Business Address"
                    url={vendor.proof_of_business_address_url}
                  />
                  <DocumentRow label="Barangay Clearance" url={vendor.barangay_clearance_url} />
                  <DocumentRow label="Mayor's Business Permit" url={vendor.mayors_permit_url} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-800 sticky bottom-0 bg-neutral-900">
          {/* <Button variant="outline" onClick={onClose}>
            Close
          </Button> */}

          <div className="flex items-center gap-2">
            {/* Accept button — only for for_review */}
            {vendor?.status === 'for_review' && (
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="bg-green-500 text-black hover:bg-green-400 font-semibold"
              >
                {approving ? 'Approving...' : 'Accept Vendor'}
              </Button>
            )}

            {/* Remove from Business — only for in_business */}
            {vendor?.status === 'in_business' && (
              <>
                {!confirmRemove ? (
                  <Button
                    variant="outline"
                    onClick={() => setConfirmRemove(true)}
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                  >
                    Remove from Business
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      This will revert vendor to For Review. Sure?
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={removing}
                      onClick={handleRemove}
                    >
                      {removing ? '...' : 'Yes, Remove'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmRemove(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Status badge for invited */}
            {vendor?.status === 'invited' && (
              <Badge variant="outline" className="text-sm px-4 py-2">
                Invited — Not Yet Registered
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
