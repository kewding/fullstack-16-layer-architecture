// VendorsTable.tsx
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function VendorsTable<TData, TValue>({
  columns,
  data,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [columnSizing, setColumnSizing] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    columnResizeMode: 'onChange',
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: 10,
      },
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: () => {},
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <Table className="w-full">
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border/60 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="
                      h-14
                      px-6
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-muted-foreground
                    "
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[320px]"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-[#3F6F64] border-t-transparent animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Loading vendors...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="
                    h-[74px]
                    border-border/50
                    transition-all
                    hover:bg-muted/30
                  "
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-6 py-5 align-middle"
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
                  className="h-[280px]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      No vendors found
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {total} vendor{total !== 1 ? 's' : ''}
          </span>

          <span className="text-xs text-muted-foreground">
            Total records
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-[110px] text-center">
            <p className="text-sm font-medium">
              Page {page}
            </p>

            <p className="text-xs text-muted-foreground">
              of {totalPages === 0 ? 1 : totalPages}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}