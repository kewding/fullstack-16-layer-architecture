import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { buildInactiveColumns } from '../../constants/userInactiveTableColumn';
import { customerService, type CustomerRow } from '../../services/customer.service';
import type { FlexibleDateRange } from '../navigation-section/DateFilter';

const PAGE_LIMIT = 20;

interface InactiveTableProps {
  search: string;
  dateRange: FlexibleDateRange;
  onView: (user: CustomerRow) => void;
  onReactivateSuccess: () => void;
}

export default function InactiveTable({
  search,
  dateRange,
  onView,
  onReactivateSuccess,
}: InactiveTableProps) {
  const [data, setData] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const dateFrom = dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined;
        const dateTo = dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined;

        const res = await customerService.listCustomers(
          currentPage,
          PAGE_LIMIT,
          search,
          'inactive',
          dateFrom,
          dateTo,
        );
        setData(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    },
    [search, dateRange],
  );

  useEffect(() => {
    setPage(1);
  }, [search, dateRange]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  const handleReactivate = async (user: CustomerRow) => {
    setActionLoading(user.user_id);
    try {
      const res = await customerService.reactivateCustomer(user.user_id);
      if (res.success) {
        fetchData(page);
        onReactivateSuccess();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const columns = buildInactiveColumns({
    onView,
    onReactivate: handleReactivate,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-gray-50">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
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
                <TableCell colSpan={columns.length} className="py-16 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-gray-300" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-red-500"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-gray-400"
                >
                  No inactive customers found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    actionLoading === row.original.user_id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1 text-sm text-gray-500">
        <span>
          {total > 0
            ? `Showing ${(page - 1) * PAGE_LIMIT + 1}–${Math.min(page * PAGE_LIMIT, total)} of ${total}`
            : 'No results'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
