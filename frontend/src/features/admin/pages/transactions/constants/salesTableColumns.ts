import type { ColumnDef } from '@tanstack/react-table';

import type { SalesTableSchema } from '../schemas/transactions.schema';

export const SALES_TABLE_COLUMNS: ColumnDef<SalesTableSchema>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ getValue }) => (getValue() as Date).toLocaleDateString(),
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'details',
    header: 'Details',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => `PHP ${row.getValue('amount')}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];
