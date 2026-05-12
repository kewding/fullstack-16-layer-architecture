// TransactionsTable.tsx

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';

import {
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';

interface TransactionsTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function TransactionsTable<TData, TValue>({
  columns,
  data,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
  label = 'records',
}: TransactionsTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount: totalPages,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: 10,
      },
    },

    onPaginationChange: () => {},
  });

  return (
    <div className="flex flex-col">

      {/* ───────────────── Table ───────────────── */}

      <div className="overflow-x-auto">
        <Table>

          {/* Header */}

          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="bg-muted/40 hover:bg-muted/40"
              >
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="
                      h-12 px-5 text-xs font-semibold
                      uppercase tracking-wide text-muted-foreground
                    "
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(
                          h.column.columnDef.header,
                          h.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          {/* Body */}

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32"
                >
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3f6f64] border-t-transparent" />
                    Loading transactions...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="
                    transition-colors
                    hover:bg-muted/40
                  "
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="
                        px-5 py-4 align-middle
                        text-sm
                      "
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40"
                >
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Inbox className="h-6 w-6 text-[#3f6f64]" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        No transactions found
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Try adjusting your filters or search query.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ───────────────── Footer ───────────────── */}

      <div
        className="
          flex flex-col gap-3 border-t px-5 py-4
          sm:flex-row sm:items-center sm:justify-between
        "
      >
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} {label} total
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="px-2 text-sm text-muted-foreground">
            Page {page} of {Math.max(totalPages, 1)}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}