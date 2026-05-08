import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import type { CustomerRow } from '../services/customer.service';

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-violet-100 text-violet-700',
  faculty: 'bg-amber-100 text-amber-700',
};

interface InactiveColumnActions {
  onView: (user: CustomerRow) => void;
  onReactivate: (user: CustomerRow) => void;
}

export function buildInactiveColumns({
  onView,
  onReactivate,
}: InactiveColumnActions): ColumnDef<CustomerRow>[] {
  return [
    {
      accessorKey: 'inst_id',
      header: 'School ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-gray-600">{row.original.inst_id}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) =>
        [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' '),
      cell: ({ row }) => {
        const { first_name, middle_name, last_name } = row.original;
        const full = [first_name, middle_name, last_name].filter(Boolean).join(' ');
        return <span className="font-medium text-gray-900">{full}</span>;
      },
    },
    {
      accessorKey: 'customer_role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.customer_role;
        return (
          <Badge className={`capitalize text-xs font-semibold ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-600'}`}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'deleted_at',
      header: 'Date Removed',
      cell: ({ row }) => {
        const deletedAt = row.original.deleted_at;
        return (
          <span className="text-sm text-gray-500">
            {deletedAt ? format(new Date(deletedAt), 'MMM d, yyyy') : '—'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => onView(row.original)}
          >
            <Eye className="size-3.5" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={() => onReactivate(row.original)}
          >
            <RotateCcw className="size-3.5" />
            Reactivate
          </Button>
        </div>
      ),
    },
  ];
}