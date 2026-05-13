import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, X } from 'lucide-react';
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
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  );
}

function DocumentRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{label}</span>
      </div>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-600 underline hover:text-blue-500"
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
      setLoading(true);
      setError(null);

      try {
        const data = await vendorService.getVendorDetail(vendorID);
        setVendor(data);
      } catch {
        setError('Failed to load vendor details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorID]);

  const handleApprove = async () => {
    if (!vendor) return;

    setApproving(true);
    setError(null);

    try {
      const res = await vendorService.approveVendor(vendorID);

      if (res.success) {
        onApproved();
        onClose();
      } else {
        setError(res.error?.message ?? 'Failed to approve vendor.');
      }
    } catch {
      setError('A network error occurred.');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Vendor Review
            </h2>

            {vendor && <p className="text-sm text-muted-foreground">{vendor.email}</p>}
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-14 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading vendor details...
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : vendor ? (
          <div className="grid grid-cols-1 gap-10 p-6 lg:grid-cols-2">
            {/* Personal */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>

              <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/20 p-5">
                <InfoRow label="First Name" value={vendor.first_name} />
                <InfoRow label="Last Name" value={vendor.last_name} />
                <InfoRow label="Middle Name" value={vendor.middle_name} />
                <InfoRow label="Birth Date" value={vendor.birth_date} />
                <InfoRow label="Contact Number" value={vendor.contact_number} />
                <InfoRow label="Stall / Business Name" value={vendor.stall_name} />
              </div>
            </div>

            {/* Business */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Business Information</h3>

              <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      DTI BNRS / SEC Number
                    </span>
                    {vendor.is_dti_verified && (
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>

                  <span className="text-sm text-foreground">{vendor.dti_sec_number || '—'}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">TIN</span>
                    {vendor.is_tin_verified && (
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>

                  <span className="text-sm text-foreground">{vendor.tin || '—'}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Supporting Documents
                    </span>

                    {vendor.is_documents_verified && (
                      <Badge variant="default" className="text-xs">
                        All Verified
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-lg border bg-white px-4">
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
          </div>
        ) : null}

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-white px-6 py-5">
          {vendor?.status === 'for_review' && (
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="h-10 rounded-lg bg-[#3F6F64] text-white hover:bg-[#345d54]"
            >
              {approving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </span>
              ) : (
                'Accept Vendor'
              )}
            </Button>
          )}

          {vendor?.status === 'in_business' && (
            <Badge variant="default" className="px-4 py-2 text-sm">
              In Business
            </Badge>
          )}

          {vendor?.status === 'invited' && (
            <Badge variant="outline" className="px-4 py-2 text-sm">
              Invited — Not Yet Registered
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}