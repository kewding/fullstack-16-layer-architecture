import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { RevokeVendorModal } from '../components/RevokeVendorModal';
import { VendorDetailModal } from '../components/VendorDetailModal';
import { capitalizeWords } from '../helper/capitalize';
import type { VendorReviewRow } from '../services/vendor.service';

function ActionButtons({
  id,
  email,
  status,
  onRevoked,
  onApproved,
}: {
  id: string;
  email: string;
  status: string;
  onRevoked: () => void;
  onApproved: () => void;
}) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const canRevoke = status === 'invited' || status === 'for_review';
  const canView = status === 'for_review' || status === 'in_business';

  return (
    <>
      <div className="flex items-center gap-2">
        {canView && (
          <Button variant="outline"
  size="sm"
  className="
    h-9 rounded-lg
    border-border
    hover:border-[#3F6F64]/40
    hover:bg-[#3F6F64]/5
  " onClick={() => setShowDetailModal(true)}>
            View
          </Button>
        )}

        {canRevoke && (
          <Button
             variant="outline"
  size="sm"
  className="
    h-9 rounded-lg
    border-red-500/30
    bg-red-500/5
    text-red-500
    hover:bg-red-500/10
    hover:text-red-500
  "
            onClick={() => setShowRevokeModal(true)}
          >
            Remove
          </Button>
        )}
      </div>

      {showDetailModal && (
        <VendorDetailModal
          vendorID={id}
          onClose={() => setShowDetailModal(false)}
          onApproved={() => {
            onApproved();
            setShowDetailModal(false);
          }}
        />
      )}

      {showRevokeModal && (
        <RevokeVendorModal
          vendorID={id}
          vendorEmail={email}
          onClose={() => setShowRevokeModal(false)}
          onRevoked={() => {
            onRevoked();
            setShowRevokeModal(false);
          }}
        />
      )}
    </>
  );
}

export const VENDORS_STATUS_TABLE_COLUMNS = (
  onRevoked: () => void,
  onApproved: () => void,
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
    size: 130,
    minSize: 100,
    maxSize: 150,
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
          email={row.original.email}
          status={row.original.status}
          onRevoked={onRevoked}
          onApproved={onApproved}
        />
      </div>
    ),
  },
];