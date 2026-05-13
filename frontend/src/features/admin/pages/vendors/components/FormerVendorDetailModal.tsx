import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, X } from 'lucide-react';
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
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  );
}

function DocumentRow({ label, url }: { label: string; url: string | null | undefined }) {
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
          className="text-xs font-medium text-[#CD9A34] underline underline-offset-2 hover:text-[#CD9A34]/80"
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
        setError('Failed to load former vendor details.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Former Vendor
            </h2>

            {detail && (
              <p className="text-sm text-muted-foreground">
                {detail.stall_name} · {detail.email}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="
              flex h-9 w-9 items-center justify-center rounded-lg
              text-muted-foreground
              hover:bg-muted/40 hover:text-foreground
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-14 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-[#CD9A34]" />
            Loading details...
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : detail ? (
          <div className="flex flex-col gap-8 p-6">
            {/* Removal Info */}
            <div className="rounded-xl border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Removal Information
              </p>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <InfoRow label="Removed By" value={detail.removed_by} />
                <InfoRow label="Removed At" value={formatDate(detail.removed_at)} />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">Reason(s)</span>

                <div className="flex flex-wrap gap-2">
                  {detail.reasons.map((r) => (
                    <span
                      key={r}
                      className="
                        rounded-full border border-red-500/30
                        bg-red-500/5 px-3 py-1
                        text-xs font-medium text-red-500
                      "
                    >
                      {REASON_LABELS[r] ?? r}
                    </span>
                  ))}
                </div>

                {detail.other_reason && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Note: </span>
                    {detail.other_reason}
                  </p>
                )}
              </div>
            </div>

            {/* Info Grids */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* Personal */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Personal Information
                </h3>

                <div className="grid grid-cols-2 gap-4 rounded-xl border bg-white p-5">
                  <InfoRow label="First Name" value={detail.personal_info?.first_name} />
                  <InfoRow label="Last Name" value={detail.personal_info?.last_name} />
                  <InfoRow label="Middle Name" value={detail.personal_info?.middle_name} />
                  <InfoRow label="Birth Date" value={detail.personal_info?.birth_date} />
                  <InfoRow
                    label="Contact Number"
                    value={detail.personal_info?.contact_number}
                  />
                  <InfoRow label="Stall Name" value={detail.personal_info?.stall_name} />
                </div>
              </div>

              {/* Business */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Business Information
                </h3>

                <div className="flex flex-col gap-4 rounded-xl border bg-white p-5">
                  <InfoRow
                    label="DTI BNRS / SEC Number"
                    value={detail.business_info?.dti_sec_number}
                  />

                  <InfoRow label="TIN" value={detail.business_info?.tin} />

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Supporting Documents
                    </span>

                    <div className="rounded-lg border bg-muted/20 px-4">
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
            </div>

            {/* Ledger Summary */}
            {detail.ledger_summary && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">Ledger Summary</h3>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Total Gross Profit</p>
                    <p className="mt-1 text-sm font-semibold text-green-600">
                      {formatPHP(detail.ledger_summary.total_gross_profit)}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Total Concession Fees</p>
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {formatPHP(detail.ledger_summary.total_concession_fees)}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Total Remittances</p>
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {formatPHP(detail.ledger_summary.total_remittances)}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Final Net Balance</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatPHP(detail.ledger_summary.final_net_balance)}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Billing Months Posted</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {detail.ledger_summary.total_sales_count}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    className="
                      h-10 gap-2 rounded-lg
                      border-border
                      hover:border-[#CD9A34]/40
                      hover:bg-[#CD9A34]/5
                    "
                    onClick={handleDownloadCSV}
                  >
                    <Download className="h-4 w-4" />
                    Download Full Ledger (CSV)
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end border-t bg-white px-6 py-5">
          <Button variant="outline" className="h-10 rounded-lg" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}