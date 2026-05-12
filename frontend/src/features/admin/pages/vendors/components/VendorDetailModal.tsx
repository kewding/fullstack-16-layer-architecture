import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { vendorService, type VendorDetailResponse } from '../services/vendor.service';

interface VendorDetailModalProps {
  vendorID: string;
  onClose: () => void;
  onApproved: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-black">{value || '—'}</span>
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

export function VendorDetailModal({ vendorID, onClose, onApproved }: VendorDetailModalProps) {
  const [vendor, setVendor] = useState<VendorDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await vendorService.getVendorDetail(vendorID);
        setVendor(data);
      } catch {
        setError('Failed to load vendor details');
      } finally {
        setLoading(false);
      }
    })();
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

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 sticky top-0 bg-[hsl(var(--modal-background))] z-10">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold">Vendor Review</h2>
            {vendor && <p className="text-sm text-muted-foreground">{vendor.email}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:text-[#415B5A] transition-colors"
          >
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
              <h3 className="modal-section-title">Personal Information</h3>
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
              <h3 className="modal-section-title">Business Information</h3>
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
                  <span className="modal-value text-black">{vendor.dti_sec_number || '—'}</span>
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
                  <span className="modal-value text-black">{vendor.tin || '—'}</span>
                </div>

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

        {/* Footer — only approve button for for_review; read-only badge for in_business */}
        <div className="flex items-center justify-end p-6 border-t border-neutral-800 sticky bottom-0 bg-[hsl(var(--modal-background))]">
          {vendor?.status === 'for_review' && (
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="gap-2 p-3 bg-[#3F6F64] text-white hover:bg-white hover:text-[#3F6F64] border border-[#3F6F64] transition-colors"
            >
              {approving ? 'Approving...' : 'Accept Vendor'}
            </Button>
          )}

          {vendor?.status === 'in_business' && (
            <Badge variant="default" className="text-sm px-4 py-2">
              In Business
            </Badge>
          )}

          {vendor?.status === 'invited' && (
            <Badge variant="outline" className="text-sm px-4 py-2">
              Invited — Not Yet Registered
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}