import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

import { ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { vendorService, type FormerVendorRow } from '../services/vendor.service';
import { FormerVendorDetailModal } from './FormerVendorDetailModal';

const COLUMNS: ColumnDef<FormerVendorRow>[] = [
  {
    accessorKey: 'stall_name',
    header: 'Stall Name',
    cell: ({ row }) => row.original.stall_name || '—',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'owner_name',
    header: 'Owner Name',
    cell: ({ row }) => row.original.owner_name || '—',
  },
  {
    accessorKey: 'removed_by',
    header: 'Removed By',
    cell: ({ row }) => row.original.removed_by || '—',
  },
  {
    accessorKey: 'removed_at',
    header: () => <div className="text-center">Date Removed</div>,
    cell: ({ row }) => (
      <div className="text-center text-sm text-muted-foreground">
        {new Date(row.original.removed_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </div>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => <ViewButton formerVendorID={row.original.id} />,
  },
];

function ViewButton({ formerVendorID }: { formerVendorID: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          className="
            h-9 rounded-lg
            border-border
            text-foreground
            hover:border-[#CD9A34]/40
            hover:bg-[#CD9A34]/5
          "
          onClick={() => setShowModal(true)}
        >
          View
        </Button>
      </div>

      {showModal && (
        <FormerVendorDetailModal
          formerVendorID={formerVendorID}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export function FormerVendorsTable() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<FormerVendorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await vendorService.listFormerVendors(page, search, dateFrom, dateTo);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch former vendors:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns: COLUMNS,
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

  const hasFilters = !!(search || dateFrom || dateTo);

  return (
    <div className="flex flex-col gap-5">
      {/* ───────────────── Header ───────────────── */}

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Former Vendors
        </h2>

        <p className="text-sm text-muted-foreground">
          Vendors that have been removed from business.
        </p>
      </div>

      {/* ───────────────── Filters ───────────────── */}

      <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-[320px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stall name, owner, or email"
              className="h-10 pl-10"
            />
          </div>

          {/* From */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 w-[180px]"
            />
          </div>

          {/* To */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 w-[180px]"
            />
          </div>
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-lg"
            onClick={() => {
              setSearch('');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* ───────────────── Table ───────────────── */}

      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="bg-muted/40 hover:bg-muted/40">
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
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} className="h-32">
                    <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#CD9A34] border-t-transparent" />
                      Loading former vendors...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="transition-colors hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-5 py-4 align-middle text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} className="h-40">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Inbox className="h-6 w-6 text-[#CD9A34]" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">No former vendors found</p>

                        <p className="text-xs text-muted-foreground">
                          Try adjusting your search or date filters.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ───────────────── Footer Pagination ───────────────── */}

        <div
          className="
            flex flex-col gap-3 border-t px-5 py-4
            sm:flex-row sm:items-center sm:justify-between
          "
        >
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} former vendor{total !== 1 ? 's' : ''} total
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setPage((p) => p - 1)}
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
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}