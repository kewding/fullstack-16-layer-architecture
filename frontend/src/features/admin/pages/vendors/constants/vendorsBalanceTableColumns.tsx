import type { ColumnDef } from '@tanstack/react-table';
import { capitalizeWords } from '../helper/capitalize';
import type { VendorBalanceRow } from '../services/vendor.service';

export const VENDORS_BALANCE_TABLE_COLUMNS: ColumnDef<VendorBalanceRow>[] = [
  {
    accessorKey: 'stall_name',
    header: 'Stall Name',
    cell: ({ row }) =>
      capitalizeWords(row.original.stall_name) ?? (
        <span className="text-muted-foreground italic text-xs">—</span>
      ),
  },
  {
    accessorKey: 'vendor_profit',
    header: 'Profit',
    cell: ({ row }) =>
      new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(row.original.vendor_profit),
  },
  {
    accessorKey: 'concession_fee',
    header: 'Fee',
    cell: ({ row }) => {
      const { concession_fee_type, concession_fee_value, concession_fee } = row.original;
      if (!concession_fee_type) {
        return <span className="text-muted-foreground text-xs">Not set</span>;
      }
      const label =
        concession_fee_type === 'percentage'
          ? `${concession_fee_value}%`
          : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
              concession_fee_value ?? 0,
            );
      return (
        <span className="flex flex-col">
          <span>
            {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
              concession_fee,
            )}
          </span>
          <span className="text-xs text-muted-foreground">({label})</span>
        </span>
      );
    },
  },
  {
    accessorKey: 'net_profit',
    header: 'Balance',
    cell: ({ row }) => (
      <span className="font-semibold text-green-400">
        {new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
        }).format(row.original.net_profit)}
      </span>
    ),
  },
];
