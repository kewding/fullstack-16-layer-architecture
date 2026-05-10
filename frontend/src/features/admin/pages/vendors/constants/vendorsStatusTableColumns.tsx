import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { VendorDetailModal } from '../components/VendorDetailModal';
import { capitalizeWords } from '../helper/capitalize';
import type { VendorReviewRow } from '../services/vendor.service';
import { vendorService } from '../services/vendor.service';

function ActionButtons({
  id,
  status,
  onRevoked,
  onApproved,
  onRemoved,
}: {
  id: string;
  status: string;
  onRevoked: () => void;
  onApproved: () => void;
  onRemoved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const canRevoke = status === 'invited' || status === 'for_review';
  const canView = status === 'for_review' || status === 'in_business';

  const handleRevoke = async () => {
    setLoading(true);
    try {
      const res = await vendorService.revokeVendor(id);
      if (res.success) {
        onRevoked();
      } else {
        alert(res.error?.message ?? 'Failed to revoke vendor');
      }
    } catch {
      alert('A network error occurred');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {canView && (
          <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
            View
          </Button>
        )}

        {canRevoke && (
          <>
            {!confirmOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="border-red-400/50 text-red-400 bg-red-100 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => setConfirmOpen(true)}
              >
                Remove
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Sure?</span>
                <Button size="sm" variant="destructive" disabled={loading} onClick={handleRevoke}>
                  {loading ? '...' : 'Yes'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmOpen(false)}>
                  No
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <VendorDetailModal
          vendorID={id}
          onClose={() => setShowModal(false)}
          onApproved={() => {
            onApproved();
            setShowModal(false);
          }}
          onRemoved={() => {
            onRemoved();
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

export const VENDORS_STATUS_TABLE_COLUMNS = (
  onRevoked: () => void,
  onApproved: () => void,
  onRemoved: () => void,
): ColumnDef<VendorReviewRow>[] => [
  {
    accessorKey: 'owner_name',
    header: 'Owner Name',
    cell: ({ row }) =>
      capitalizeWords(row.original.owner_name) ?? (
        <span className="text-muted-foreground italic text-xs">Pending</span>
      ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 150,
    minSize: 130,
    maxSize: 180,
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        invited: 'outline',
        for_review: 'secondary',
        in_business: 'default',
      };
      const labelMap: Record<string, string> = {
        invited: 'Invited',
        for_review: 'For Review',
        in_business: 'In Business',
      };
      return (
        <div className="flex justify-center">
          <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'invited_by_name',
    header: 'Invited By',
    cell: ({ row }) => capitalizeWords(row.original.invited_by_name),
  },
  {
    accessorKey: 'invited_at',
    header: () => <div className="text-center">Invite Date</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {new Date(row.original.invited_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <ActionButtons
          id={row.original.id}
          status={row.original.status}
          onRevoked={onRevoked}
          onApproved={onApproved}
          onRemoved={onRemoved}
        />
      </div>
    ),
  },
];
