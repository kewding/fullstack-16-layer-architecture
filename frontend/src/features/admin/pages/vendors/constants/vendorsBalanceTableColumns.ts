import type { ColumnDef } from '@tanstack/react-table';

export const VENDORS_BALANCE_TABLE_COLUMNS: ColumnDef<any>[] = [
  {
    accessorKey: 'stallName',
    header: 'Stall Name',
  },
  {
    accessorKey: 'vendorProfit',
    header: 'Profit',
  },
  {
    accessorKey: 'concessionFee',
    header: 'Fee',
  },
  {
    accessorKey: 'netProfit',
    header: 'Balance',
  },
];
