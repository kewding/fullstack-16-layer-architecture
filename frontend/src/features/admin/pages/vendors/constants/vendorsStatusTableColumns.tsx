import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import type { VendorReviewRow } from '../services/vendor.service';
import { vendorService } from '../services/vendor.service';

function ActionButtons({
  id,
  status,
  onRevoked,
}: {
  id: string;
  status: string;
  onRevoked: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canRevoke = status === 'invited' || status === 'for_review';

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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        View
      </Button>

      {canRevoke && (
        <>
          {!confirmOpen ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400"
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
  );
}

export const VENDORS_STATUS_TABLE_COLUMNS = (
  onRevoked: () => void,
): ColumnDef<VendorReviewRow>[] => [
  {
    accessorKey: 'owner_name',
    header: 'Owner Name',
    cell: ({ row }) =>
      row.original.owner_name ?? (
        <span className="text-muted-foreground italic text-xs">Pending</span>
      ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
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
      return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
    },
  },
  {
    accessorKey: 'invited_by_name',
    header: 'Invited By',
  },
  {
    accessorKey: 'invited_at',
    header: 'Invite Date',
    cell: ({ row }) =>
      new Date(row.original.invited_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <ActionButtons id={row.original.id} status={row.original.status} onRevoked={onRevoked} />
    ),
  },
];
