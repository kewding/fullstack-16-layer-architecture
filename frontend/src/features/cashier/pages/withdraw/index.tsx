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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  REJECTION_REASON_LABELS,
  withdrawalService,
  type CashierWithdrawalCompletedRow,
  type CashierWithdrawalRejectedRow,
  type CashierWithdrawalRow,
  type RejectionReason,
} from './services/withdraw.service';

// ── helpers ───────────────────────────────────────────────────────────────────

function peso(val: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
}

function fmtDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy · h:mm a');
}

// ── Reject modal ──────────────────────────────────────────────────────────────

interface RejectModalProps {
  requestId: string;
  studentName: string;
  amount: number;
  onClose: () => void;
  onRejected: () => void;
}

const REJECTION_OPTIONS: { value: RejectionReason; label: string }[] = [
  { value: 'suspected_fraud', label: 'Suspected Fraud' },
  { value: 'user_cancelled', label: 'User Cancelled' },
  { value: 'other', label: 'Other' },
];

function RejectModal({ requestId, studentName, amount, onClose, onRejected }: RejectModalProps) {
  const [reason, setReason] = useState<RejectionReason | ''>('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async () => {
    if (!reason) {
      setError('Please select a rejection reason.');
      return;
    }
    if (reason === 'other' && !comment.trim()) {
      setError('Please enter a comment for "Other".');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await withdrawalService.rejectRequest(
      requestId,
      reason as RejectionReason,
      comment,
    );
    if (res.success) {
      onRejected();
      onClose();
    } else {
      setError(res.error?.message ?? 'Failed to reject request.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reject Withdrawal</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-neutral-400">
          Rejecting <span className="text-white font-medium">{studentName}</span>'s withdrawal of{' '}
          <span className="text-white font-medium">{peso(amount)}</span>.
        </p>

        {/* Reason select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-neutral-300">Rejection Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as RejectionReason)}
            className="h-10 rounded-md border border-neutral-600 bg-neutral-800 px-3 text-sm text-white focus:outline-none focus:border-white"
          >
            <option value="" disabled>
              Select a reason…
            </option>
            {REJECTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Comment (required for "other") */}
        {reason === 'other' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-neutral-300">
              Comment <span className="text-red-400">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Provide additional details…"
              className="rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-white"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-neutral-600" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={loading}
            onClick={handleReject}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Pending table ─────────────────────────────────────────────────────────────

interface PendingTableProps {
  search: string;
  onRefresh: () => void;
}

function PendingTable({ search, onRefresh }: PendingTableProps) {
  const [data, setData] = useState<CashierWithdrawalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CashierWithdrawalRow | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await withdrawalService.listPendingRequests(p, search);
        setData(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    load(page);
  }, [load, page]);

  const handleComplete = async (row: CashierWithdrawalRow) => {
    setActionLoading(row.id);
    const res = await withdrawalService.completeRequest(row.id);
    if (res.success) {
      load(page);
      onRefresh();
    } else alert(res.error?.message ?? 'Failed to complete request.');
    setActionLoading(null);
  };

  return (
    <>
      <div className="rounded-md border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 bg-neutral-900">
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Student
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Amount
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Requested
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-400" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-neutral-500">
                  No pending withdrawal requests.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isActing = actionLoading === row.id;
                return (
                  <TableRow
                    key={row.id}
                    className={`border-neutral-800 hover:bg-neutral-800/40 transition-opacity ${isActing ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <TableCell className="text-sm text-white font-medium">
                      {row.full_name}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-red-400">
                      {peso(row.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-400">
                      {fmtDate(row.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                          disabled={isActing}
                          onClick={() => handleComplete(row)}
                        >
                          {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Complete'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400 text-xs"
                          disabled={isActing}
                          onClick={() => setRejectTarget(row)}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-neutral-500 px-1">
        <span>
          {total} request{total !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-neutral-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-neutral-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {rejectTarget && (
        <RejectModal
          requestId={rejectTarget.id}
          studentName={rejectTarget.full_name}
          amount={rejectTarget.amount}
          onClose={() => setRejectTarget(null)}
          onRejected={() => {
            load(page);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// ── Completed table ───────────────────────────────────────────────────────────

function CompletedTable({ search }: { search: string }) {
  const [data, setData] = useState<CashierWithdrawalCompletedRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await withdrawalService.listCompletedRequests(p, search);
        setData(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    load(page);
  }, [load, page]);

  return (
    <>
      <div className="rounded-md border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 bg-neutral-900">
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Student
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Amount
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Balance Before
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Balance After
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Cashier
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-400" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-neutral-500">
                  No completed withdrawals.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="border-neutral-800 hover:bg-neutral-800/40">
                  <TableCell className="text-sm text-white font-medium">{row.full_name}</TableCell>
                  <TableCell className="text-sm font-semibold text-red-400">
                    {peso(row.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400 tabular-nums">
                    {peso(row.balance_before)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400 tabular-nums">
                    {peso(row.balance_after)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">{row.cashier_name}</TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {format(new Date(row.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-neutral-500 px-1">
        <span>
          {total} record{total !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-neutral-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-neutral-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Rejected table ────────────────────────────────────────────────────────────

function RejectedTable({ search }: { search: string }) {
  const [data, setData] = useState<CashierWithdrawalRejectedRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await withdrawalService.listRejectedRequests(p, search);
        setData(res.data);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    load(page);
  }, [load, page]);

  return (
    <>
      <div className="rounded-md border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 bg-neutral-900">
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Student
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Amount
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Reason
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Comment
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Cashier
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-neutral-400">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-400" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-neutral-500">
                  No rejected withdrawals.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="border-neutral-800 hover:bg-neutral-800/40">
                  <TableCell className="text-sm text-white font-medium">{row.full_name}</TableCell>
                  <TableCell className="text-sm font-semibold text-neutral-300">
                    {peso(row.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {REJECTION_REASON_LABELS[
                      row.rejection_reason as keyof typeof REJECTION_REASON_LABELS
                    ] ?? row.rejection_reason}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {row.rejection_comment ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">{row.cashier_name}</TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {format(new Date(row.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-neutral-500 px-1">
        <span>
          {total} record{total !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-neutral-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-neutral-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabType = 'pending' | 'completed' | 'rejected';

export const CashierWithdrawPage: React.FC = () => {
  const [tab, setTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const count = await withdrawalService.getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full gap-4">
        <h1 className="text-2xl font-semibold">
          Withdrawals
        </h1>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)}>
          <TabsList className="flex h-auto w-auto bg-transparent p-0 gap-2">
            <TabsTrigger value="pending" className="px-4 py-2 rounded-lg relative">
              Requests
              {pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#CD9A34] text-white leading-none">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-4 py-2 rounded-lg">
              Completed
            </TabsTrigger>
            <TabsTrigger value="rejected" className="px-4 py-2 rounded-lg">
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name…"
            className="pl-9"
          />
        </div>

        {/* Table per tab */}
        {tab === 'pending' && <PendingTable search={search} onRefresh={refreshCount} />}
        {tab === 'completed' && <CompletedTable search={search} />}
        {tab === 'rejected' && <RejectedTable search={search} />}
      </main>
    </div>
  );
};
