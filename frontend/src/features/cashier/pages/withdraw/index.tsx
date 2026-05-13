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

function PaginationFooter({
  page,
  totalPages,
  total,
  label,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} {label}
        {total !== 1 ? 's' : ''} total
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          disabled={page <= 1}
          onClick={onPrev}
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
          disabled={page >= totalPages}
          onClick={onNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Reject Withdrawal
          </h2>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Rejecting <span className="font-semibold text-foreground">{studentName}</span>'s
            withdrawal of <span className="font-semibold text-foreground">{peso(amount)}</span>.
          </p>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rejection Reason
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {REJECTION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setReason(o.value);
                    setError(null);
                  }}
                  className={`
                    rounded-lg border px-3 py-2.5 text-left text-sm transition-colors
                    ${
                      reason === o.value
                        ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-muted bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }
                  `}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {reason === 'other' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Comment <span className="text-red-600">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Provide additional details…"
                className="w-full resize-none rounded-lg border bg-white p-3 text-sm text-foreground outline-none focus:border-muted-foreground"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-lg"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleReject}
            disabled={loading || !reason}
            className="h-10 flex-1 rounded-lg bg-red-600 text-white hover:bg-red-500"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Reject'}
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
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Student
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Requested
              </TableHead>
              <TableHead className="h-12 px-5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32">
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3f6f64] border-t-transparent" />
                    Loading requests...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-sm text-muted-foreground">
                  No pending withdrawal requests.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const isActing = actionLoading === row.id;

                return (
                  <TableRow
                    key={row.id}
                    className={`transition-colors hover:bg-muted/40 ${
                      isActing ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    <TableCell className="px-5 py-4 text-sm font-medium text-foreground">
                      {row.full_name}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm font-semibold text-red-600">
                      {peso(row.amount)}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {fmtDate(row.created_at)}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-center align-middle">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          size="sm"
                          className="h-9 rounded-lg bg-green-600 text-white hover:bg-green-500"
                          disabled={isActing}
                          onClick={() => handleComplete(row)}
                        >
                          {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-lg border-red-500/30 bg-red-500/5 text-red-600 hover:bg-red-500/10 hover:text-red-600"
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

        <PaginationFooter
          page={page}
          totalPages={totalPages}
          total={total}
          label="request"
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
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
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Student
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Balance Before
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Balance After
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cashier
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

        <PaginationFooter
          page={page}
          totalPages={totalPages}
          total={total}
          label="request"
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
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
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Student
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reason
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comment
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cashier
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

        <PaginationFooter
          page={page}
          totalPages={totalPages}
          total={total}
          label="request"
          onPrev={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
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
    <div className="w-full px-1">
      <main className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Withdrawals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and process withdrawal requests from students.
            </p>
          </div>
        </div>

        {/* Connected Tabs */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-0">
            <div className="flex items-center gap-1 bg-transparent p-0">
              <button
                onClick={() => setTab('pending')}
                className={`
                  relative rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-medium
                  ${
                    tab === 'pending'
                      ? 'z-10 bg-white text-foreground border border-border border-b-white'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                Requests
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#CD9A34] px-2 py-0.5 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTab('completed')}
                className={`
                  relative rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-medium
                  ${
                    tab === 'completed'
                      ? 'z-10 bg-white text-foreground border border-border border-b-white'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                Completed
              </button>

              <button
                onClick={() => setTab('rejected')}
                className={`
                  relative rounded-t-xl rounded-b-none px-5 py-2.5 text-sm font-medium
                  ${
                    tab === 'rejected'
                      ? 'z-10 bg-white text-foreground border border-border border-b-white'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Connected Surface */}
          <div className="rounded-b-2xl rounded-tr-2xl border bg-white overflow-hidden">
            {/* Filters */}
            <div className="border-b px-6 py-5">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name..."
                  className="h-10 pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="p-6">
              {tab === 'pending' && <PendingTable search={search} onRefresh={refreshCount} />}
              {tab === 'completed' && <CompletedTable search={search} />}
              {tab === 'rejected' && <RejectedTable search={search} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
