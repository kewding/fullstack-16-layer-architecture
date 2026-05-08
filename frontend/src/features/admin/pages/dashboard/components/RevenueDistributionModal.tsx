import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboardService, type RevenueDistributionData } from '../services/dashboard.service';

interface RevenueDistributionModalProps {
  open: boolean;
  onClose: () => void;
  dateFrom?: string;
  dateTo?: string;
}

function peso(v: number) {
  return `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

export default function RevenueDistributionModal({
  open, onClose, dateFrom, dateTo,
}: RevenueDistributionModalProps) {
  const [data, setData] = useState<RevenueDistributionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardService.getRevenueDistribution(dateFrom, dateTo)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, dateFrom, dateTo]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revenue Distribution by Stall</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        )}
        {error && <p className="py-8 text-center text-sm text-red-500">{error}</p>}

        {data && (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stall</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Gross Sales</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Concession Fee</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Net to Vendor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.stalls.map((row, i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-800">{row.stall_name}</TableCell>
                    <TableCell className="text-right tabular-nums text-gray-600">{peso(row.gross_sales)}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600">{peso(row.concession_fee)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-gray-900">{peso(row.net_to_vendor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end border-t pt-3 text-sm font-semibold text-gray-700">
              Total Gross: <span className="ml-2 text-blue-600">{peso(data.total_gross)}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}