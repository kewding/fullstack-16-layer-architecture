// src/features/vendor/pages/transactions/VendorTransactionsPage.tsx

import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { VendorTransactionFilters } from './components/VendorTransactionFilter';
import { VendorTransactionGroup } from './components/VendorTransactionGroup';
import { VendorTxDetailModal } from './components/VendorTsxDetailModal';
import {
  vendorTransactionsService,
  type VendorTxRow,
  type VendorTxType,
} from './services/transaction.service';

// ── Time-period grouping ───────────────────────────────────────────────────────
type PeriodKey = 'Today' | 'This Week' | 'Last Month' | 'Older';

function getPeriodKey(isoString: string): PeriodKey {
  const now = new Date();
  const date = new Date(isoString);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfWeek) return 'This Week';
  if (date >= startOfLastMonth) return 'Last Month';
  return 'Older';
}

const PERIOD_ORDER: PeriodKey[] = ['Today', 'This Week', 'Last Month', 'Older'];

function groupTransactions(rows: VendorTxRow[]): Map<PeriodKey, VendorTxRow[]> {
  const map = new Map<PeriodKey, VendorTxRow[]>();
  for (const row of rows) {
    const key = getPeriodKey(row.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}

// ── Page ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

export function VendorTransactionsPage() {
  const [activeType, setActiveType] = useState<VendorTxType>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<VendorTxRow | null>(null);

  function handleTypeChange(type: VendorTxType) {
    setActiveType(type);
    setPage(1);
  }
  function handleDateFromChange(v: string) {
    setDateFrom(v);
    setPage(1);
  }
  function handleDateToChange(v: string) {
    setDateTo(v);
    setPage(1);
  }

  const queryKey = ['vendor-transactions', activeType, dateFrom, dateTo, page] as const;

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      vendorTransactionsService.list({
        type: activeType || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const grouped = groupTransactions(rows);

  const todayLabel = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-5">
        {/* Header */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
        </div>

        {/* Filters */}
        <VendorTransactionFilters
          activeType={activeType}
          onTypeChange={handleTypeChange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
        />

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <div className="w-5 h-5 rounded-full border-2 border-[#3f6f64] border-t-transparent animate-spin" />
            Loading transactions...
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-red-500">
            {(error as Error)?.message ?? 'Something went wrong. Please try again.'}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No transactions found.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {PERIOD_ORDER.filter((key) => grouped.has(key)).map((key) => (
              <VendorTransactionGroup
                key={key}
                label={key}
                transactions={grouped.get(key)!}
                onCardClick={(tx) => setSelectedTx(tx)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && rows.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1 pt-2">
            <span>
              {total} transaction{total !== 1 ? 's' : ''} total
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages === 0 ? 1 : totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selectedTx && (
        <VendorTxDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
}
