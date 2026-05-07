import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { customerService, type CustomerDetailResponse } from '../services/customer.service';

interface CustomerDetailModalProps {
  userID: string | null;
  open: boolean;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value ?? '—'}</span>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) return <span className="text-sm text-gray-400">None</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="text-xs">
          {item}
        </Badge>
      ))}
    </div>
  );
}

export default function CustomerDetailModal({ userID, open, onClose }: CustomerDetailModalProps) {
  const [data, setData] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userID) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    customerService
      .getCustomerDetail(userID)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userID]);

  const fullName = data
    ? [data.first_name, data.middle_name, data.last_name].filter(Boolean).join(' ')
    : '';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Detail</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && <p className="py-10 text-center text-sm text-red-500">{error}</p>}

        {data && (
          <div className="space-y-6 pt-2">
            {/* ── Personal Information ── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoRow label="School ID" value={data.inst_id} />
                <InfoRow label="Full Name" value={fullName} />
                <InfoRow label="Email" value={data.email} />
                <InfoRow label="Role" value={data.customer_role} />
                <InfoRow label="Contact No." value={data.contact_no} />
                <InfoRow
                  label="Birth Date"
                  value={data.birth_date ? format(new Date(data.birth_date), 'MMM d, yyyy') : null}
                />
                <InfoRow
                  label="Date Registered"
                  value={format(new Date(data.created_at), 'MMM d, yyyy')}
                />
              </div>
            </section>

            <Separator />

            {/* ── RFID Status ── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                RFID Status
              </h3>
              <div className="flex items-center gap-3">
                {data.rfid_tag ? (
                  <>
                    {data.rfid_is_active ? (
                      <Wifi className="size-4 text-green-500" />
                    ) : (
                      <WifiOff className="size-4 text-red-400" />
                    )}
                    <span className="font-mono text-sm text-gray-700">{data.rfid_tag}</span>
                    <Badge
                      className={
                        data.rfid_is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }
                    >
                      {data.rfid_is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">No RFID tag assigned</span>
                )}
              </div>
            </section>

            <Separator />

            {/* ── Medical Information ── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Medical Information
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <InfoRow label="Blood Type" value={data.blood_type} />
                <InfoRow
                  label="Height"
                  value={data.height_cm != null ? `${data.height_cm} cm` : null}
                />
                <InfoRow
                  label="Weight"
                  value={data.weight_kg != null ? `${data.weight_kg} kg` : null}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400 block mb-1.5">
                    Allergens
                  </span>
                  <TagList items={[...data.allergens, ...data.custom_allergens]} />
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400 block mb-1.5">
                    Medical Conditions
                  </span>
                  <TagList items={data.medical_conditions} />
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400 block mb-1.5">
                    Medications
                  </span>
                  <TagList items={data.medications} />
                </div>
              </div>
            </section>

            <Separator />

            {/* ── Emergency Contact ── */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoRow label="Name" value={data.emergency_contact_name} />
                <InfoRow label="Number" value={data.emergency_contact_number} />
                <InfoRow label="Relationship" value={data.emergency_contact_relationship} />
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
