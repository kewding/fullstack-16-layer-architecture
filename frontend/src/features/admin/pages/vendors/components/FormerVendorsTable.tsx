import { Button } from '@/components/ui/button';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FormerVendorDetailModal } from './FormerVendorDetailModal';
import { vendorService, type FormerVendorRow } from '../services/vendor.service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
      <div className="text-center">
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
        <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Former Vendors</h2>
        <p className="text-sm text-muted-foreground">
          Vendors that have been removed from business.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Stall name, owner, or email..."
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3F6F64] w-64"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3F6F64]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#3F6F64]"
          />
        </div>
        {(search || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-card shadow-sm">
        <Table className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-[hsl(var(--border))]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-6 py-4 text-muted-foreground font-semibold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="px-6 py-4 align-middle">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 rounded-full border-2 border-[#3f6f64] border-t-transparent animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-16 border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))/40] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No former vendors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>
          {total} former vendor{total !== 1 ? 's' : ''} total
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
    </div>
  );
}