import type { ColumnDef } from '@tanstack/react-table';
import type { VendorReviewRow } from '../services/vendor.service';

export const VENDORS_STATUS_TABLE_COLUMNS: ColumnDef<VendorReviewRow>[] = [
  {
    accessorKey: 'owner_name',
    header: 'Owner Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
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
    id: 'view',
    header: 'View',
    cell: () => (
      <button className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-600 hover:bg-neutral-800 transition-colors">
        View
      </button>
    ),
  },
];
