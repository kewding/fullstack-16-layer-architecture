
import { Button } from '@/components/ui/button';
import type { TransactionTypeFilter } from '../services/transactionhistory.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_FILTERS: { label: string; value: TransactionTypeFilter }[] = [
  { label: 'All',       value: ''         },
  { label: 'Purchases', value: 'purchase' },
  { label: 'Top-ups',   value: 'top-up'   },
  { label: 'Withdraws', value: 'withdraw' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface TransactionFiltersProps {
  activeType: TransactionTypeFilter;
  onTypeChange: (type: TransactionTypeFilter) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TransactionFilters({
  activeType,
  onTypeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: TransactionFiltersProps) {
  const hasDateFilter = dateFrom || dateTo;

//   const dateLabel =
//     dateFrom && dateTo
//       ? `${formatDateLabel(dateFrom)} - ${formatDateLabel(dateTo)}`
//       : dateFrom
//       ? `From ${formatDateLabel(dateFrom)}`
//       : dateTo
//       ? `To ${formatDateLabel(dateTo)}`
//       : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-wrap">
      {/* Type filter pills */}
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

// ── Helpers ───────────────────────────────────────────────────────────────────

// function formatDateLabel(yyyyMmDd: string): string {
//   const [y, m, d] = yyyyMmDd.split('-');
//   const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//   return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
// }