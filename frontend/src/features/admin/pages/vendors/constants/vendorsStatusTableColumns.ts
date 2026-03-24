import type { ColumnDef } from '@tanstack/react-table';

export const VENDORS_STATUS_TABLE_COLUMNS: ColumnDef<any>[] = [
  {
    accessorKey: 'stallName',
    header: 'Stall Name',
  },
  {
    accessorKey: 'reviewStatus',
    header: 'Status',
  },
  {
    accessorKey: 'viewDetails',
    header: 'View',
  },
];
