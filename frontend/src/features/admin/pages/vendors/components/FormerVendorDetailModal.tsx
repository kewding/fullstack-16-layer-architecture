import { Button } from '@/components/ui/button';
import { Download, FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { vendorService, type FormerVendorDetail } from '../services/vendor.service';

interface FormerVendorDetailModalProps {
  formerVendorID: string;
  onClose: () => void;
}

const REASON_LABELS: Record<string, string> = {
  wrong_invite: 'Wrong Invite',
  terminated_contract: 'Terminated Contract',
  insufficient_credentials: 'Insufficient Credentials',
  others: 'Others',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  );
}

function DocumentRow({ label, url }: { label: string; url: string | null | undefined }) {
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

const formatPHP = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export function FormerVendorDetailModal({ formerVendorID, onClose }: FormerVendorDetailModalProps) {
  const [detail, setDetail] = useState<FormerVendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await vendorService.getFormerVendorDetail(formerVendorID);
        setDetail(data);
      } catch {
        setError('Failed to load former vendor details');
      } finally {
        setLoading(false);
      }
    })();
  }, [formerVendorID]);

  const handleDownloadCSV = () => {
    vendorService.downloadLedgerCSV(formerVendorID);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 sticky top-0 bg-[hsl(var(--modal-background))] z-10">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold">Former Vendor</h2>
            {detail && (
              <p className="text-sm text-muted-foreground">
                {detail.stall_name} · {detail.email}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:text-[#415B5A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Loading details...
          </div>
        ) : error ? (
          <div className="p-6 text-red-500 text-sm">{error}</div>
        ) : detail ? (
          <div className="p-6 flex flex-col gap-8">
            {/* Removal info */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Removal Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Removed By" value={detail.removed_by} />
                <InfoRow label="Removed At" value={formatDate(detail.removed_at)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Reason(s)</span>
                <div className="flex flex-wrap gap-2">
                  {detail.reasons.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
                    >
                      {REASON_LABELS[r] ?? r}
                    </span>
                  ))}
                </div>
                {detail.other_reason && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="text-white font-medium">Note: </span>
                    {detail.other_reason}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="flex flex-col gap-4">
                <h3 className="modal-section-title">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="First Name" value={detail.personal_info?.first_name} />
                  <InfoRow label="Last Name" value={detail.personal_info?.last_name} />
                  <InfoRow label="Middle Name" value={detail.personal_info?.middle_name} />
                  <InfoRow label="Birth Date" value={detail.personal_info?.birth_date} />
                  <InfoRow label="Contact Number" value={detail.personal_info?.contact_number} />
                  <InfoRow label="Stall / Business Name" value={detail.personal_info?.stall_name} />
                </div>
              </div>

              {/* Business Information */}
              <div className="flex flex-col gap-4">
                <h3 className="modal-section-title">Business Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <InfoRow
                    label="DTI BNRS / SEC Number"
                    value={detail.business_info?.dti_sec_number}
                  />
                  <InfoRow label="TIN" value={detail.business_info?.tin} />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Supporting Documents</span>
                    <DocumentRow
                      label="Proof of Business Address"
                      url={detail.business_info?.proof_of_business_address_url}
                    />
                    <DocumentRow
                      label="Barangay Clearance"
                      url={detail.business_info?.barangay_clearance_url}
                    />
                    <DocumentRow
                      label="Mayor's Business Permit"
                      url={detail.business_info?.mayors_permit_url}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Summary */}
            {detail.ledger_summary && (
              <div className="flex flex-col gap-4">
                <h3 className="modal-section-title">Ledger Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-neutral-800 p-4 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Total Gross Profit</span>
                    <span className="text-sm font-semibold text-green-400">
                      {formatPHP(detail.ledger_summary.total_gross_profit)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-neutral-800 p-4 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Total Concession Fees</span>
                    <span className="text-sm font-semibold text-red-400">
                      {formatPHP(detail.ledger_summary.total_concession_fees)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-neutral-800 p-4 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Total Remittances</span>
                    <span className="text-sm font-semibold text-red-400">
                      {formatPHP(detail.ledger_summary.total_remittances)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-neutral-800 p-4 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Final Net Balance</span>
                    <span className="text-sm font-semibold">
                      {formatPHP(detail.ledger_summary.final_net_balance)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-neutral-800 p-4 flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Billing Months Posted</span>
                    <span className="text-sm font-semibold">
                      {detail.ledger_summary.total_sales_count}
                    </span>
                  </div>
                </div>

                {/* CSV Download */}
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownloadCSV}
                  >
                    <Download className="w-4 h-4" />
                    Download Full Ledger (CSV)
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-neutral-800 sticky bottom-0 bg-[hsl(var(--modal-background))]">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}