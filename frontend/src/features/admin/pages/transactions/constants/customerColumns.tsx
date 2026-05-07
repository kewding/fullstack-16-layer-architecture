import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { PurchaseDetailModal } from '../components/PurchaseDetailModal';
import type { CustomerTxRow } from '../schemas/transactions.schema';

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  purchase: 'default',
  'top-up': 'secondary',
  refund: 'destructive',
  withdraw: 'outline',
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'text-green-400',
  refunded: 'text-yellow-400',
  blocked: 'text-red-400',
};

function DetailsCell({ row }: { row: { original: CustomerTxRow } }) {
  const [showModal, setShowModal] = useState(false);
  if (row.original.type !== 'purchase') return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>View</Button>
      {showModal && (
        <PurchaseDetailModal saleID={row.original.id} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export const CUSTOMER_TX_COLUMNS: ColumnDef<CustomerTxRow>[] = [
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
  { accessorKey: 'full_name', header: 'Full Name' },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => new Intl.NumberFormat('en-PH', {
      style: 'currency', currency: 'PHP',
    }).format(row.original.amount),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className={`text-xs capitalize font-medium ${STATUS_STYLES[row.original.status] ?? 'text-muted-foreground'}`}>
        {row.original.status}
      </span>
    ),
  },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => <DetailsCell row={row} />,
  },
];