// src/features/vendor/pages/transactions/components/VendorTransactionFilters.tsx

import { Button } from '@/components/ui/button';
import type { VendorTxType } from '../services/transaction.service';

const TYPE_FILTERS: { label: string; value: VendorTxType }[] = [
  { label: 'All', value: '' },
  { label: 'Sales', value: 'purchase' },
  { label: 'Remittance', value: 'remittance' },
  { label: 'Concession Fee', value: 'fee' },
];

interface Props {
  activeType: VendorTxType;
  onTypeChange: (type: VendorTxType) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}

export function VendorTransactionFilters({
  activeType,
  onTypeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: Props) {
  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-wrap">
      {/* Type pills */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={activeType === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange(f.value)}
            className="rounded-full"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3F6F64]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3F6F64]"
          />
        </div>
        {hasDateFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onDateFromChange('');
              onDateToChange('');
            }}
            className="self-end"
          >
            Clear dates
          </Button>
        )}
      </div>
    </div>
  );
}
