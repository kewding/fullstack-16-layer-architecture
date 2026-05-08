import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { VendorTxRow } from '../schemas/transactions.schema';

const TYPE_VARIANTS: Record<string, 'default' | 'secondary'> = {
  sale: 'default',
  remittance: 'secondary',
};

export const VENDOR_TX_COLUMNS: ColumnDef<VendorTxRow>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    }),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={TYPE_VARIANTS[row.original.type] ?? 'outline'}>
        {row.original.type.charAt(0).toUpperCase() + row.original.type.slice(1)}
      </Badge>
    ),
  },
  { accessorKey: 'owner_name', header: 'Owner Name' },
  { accessorKey: 'stall_name', header: 'Stall Name' },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => new Intl.NumberFormat('en-PH', {
      style: 'currency', currency: 'PHP',
    }).format(row.original.amount),
  },
];