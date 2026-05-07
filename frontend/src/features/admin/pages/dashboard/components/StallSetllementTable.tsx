import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { StallSettlementData } from '../services/dashboard.service';

interface StallSettlementTableProps {
  data: StallSettlementData | null;
  loading: boolean;
}

function settlementBadge(remaining: number) {
  if (remaining <= 0) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">Settled</Badge>;
  if (remaining < 1000) return <Badge className="bg-amber-100 text-amber-700 text-xs">Low Balance</Badge>;
  return <Badge className="bg-red-100 text-red-600 text-xs">Unsettled</Badge>;
}

function peso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function StallSettlementTable({ data, loading }: StallSettlementTableProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          Stall Settlement Status
        </CardTitle>
        <p className="text-xs text-gray-400">Live balance — not affected by date range</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[290px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stall</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Total Revenue</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Remaining</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-gray-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.stalls.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-gray-400">
                    No stalls found.
                  </TableCell>
                </TableRow>
              ) : (
                data.stalls.map((row, i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell className="text-sm font-medium text-gray-800">{row.stall_name}</TableCell>
                    <TableCell className="text-sm text-gray-600 text-right tabular-nums">
                      {peso(row.total_revenue)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-right tabular-nums text-gray-900">
                      {peso(row.remaining_balance)}
                    </TableCell>
                    <TableCell>{settlementBadge(row.remaining_balance)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}