import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { notificationBus } from '@/lib/notificationBus';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildActiveColumns } from '../../constants/userActiveTableColumns';
import { customerService, type CustomerRow } from '../../services/customer.service';
import type { FlexibleDateRange } from '../navigation-section/DateFilter';

const PAGE_LIMIT = 20;
const POLL_INTERVAL_MS = 30_000;

interface ActiveTableProps {
  search: string;
  dateRange: FlexibleDateRange;
  onView: (user: CustomerRow) => void;
}

export default function ActiveTable({ search, dateRange, onView }: ActiveTableProps) {
  const [data, setData] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (currentPage: number, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const dateFrom = dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined;
        const dateTo = dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined;

        const res = await customerService.listCustomers(
          currentPage,
          PAGE_LIMIT,
          search,
          'active',
          dateFrom,
          dateTo,
        );
        setData(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [search, dateRange],
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, dateRange]);

  // Fetch on page / filter change
  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  // 30-second polling (silent refresh — no spinner)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchData(page, true);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData, page]);

  const handleDisable = async (user: CustomerRow) => {
    setActionLoading(user.user_id);
    try {
      const res = await customerService.disableCustomer(user.user_id);
      if (res.success) {
        fetchData(page, true);
        notificationBus.emit();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const columns = buildActiveColumns({
    onView,
    onDisable: handleDisable,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <section className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="border-b border-[hsl(var(--border))] hover:bg-transparent"
              >
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="
                    px-6 py-4 text-left
                    text-[11px] font-semibold
                    uppercase tracking-[0.08em]
                    text-muted-foreground
                  "
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-20 text-center">
                  <Loader2 className="mx-auto w-5 h-5 animate-spin text-[#3f6f64]" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center text-sm text-red-500"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-20 text-center text-sm text-muted-foreground"
                >
                  No active customers found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`
                  border-b border-[hsl(var(--border))]
                  hover:bg-[hsl(var(--muted))]/30
                  transition-colors
                  ${actionLoading === row.original.user_id ? 'opacity-50 pointer-events-none' : ''}
                `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total > 0
              ? `Showing ${(page - 1) * PAGE_LIMIT + 1}–${Math.min(page * PAGE_LIMIT, total)} of ${total}`
              : 'No results'}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-[hsl(var(--border))]"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-xs">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="border-[hsl(var(--border))]"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
