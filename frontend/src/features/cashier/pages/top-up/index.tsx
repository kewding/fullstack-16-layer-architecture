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
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  topUpRequestService,
  type CashierCompletedRow,
  type CashierRejectedRow,
  type CashierRequestRow,
  type RejectionReason,
  type UserDetailForCashier,
} from './services/topup.service';

// ── helpers ───────────────────────────────────────────────────────────────────

function peso(v: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);
}

function fmtDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy · h:mm a');
}

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error';
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border pointer-events-auto min-w-[300px]
          ${t.type === 'success' ? ' border-green-500/40' : ' border-red-500/40'}`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <p className="text-sm text-white flex-1">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-muted-foreground500 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const push = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, push, dismiss };
}

// ── Shared: Search + Date range filters ───────────────────────────────────────

interface SectionFilters {
  search: string;
  onSearchChange: (v: string) => void;
  dateStart: string;
  dateEnd: string;
  onDateStartChange: (v: string) => void;
  onDateEndChange: (v: string) => void;
}

function SectionFilters({
  search,
  onSearchChange,
  dateStart,
  dateEnd,
  onDateStartChange,
  onDateEndChange,
}: SectionFilters) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative w-full sm:w-[320px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>

        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by customer name"
          className="h-10 pl-10"
        />
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">From</label>
          <Input
            type="date"
            value={dateStart}
            onChange={(e) => onDateStartChange(e.target.value)}
            className="h-10 w-[160px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground font-medium">To</label>
          <Input
            type="date"
            value={dateEnd}
            onChange={(e) => onDateEndChange(e.target.value)}
            className="h-10 w-[160px]"
          />
        </div>

        {(dateStart || dateEnd) && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-lg"
            onClick={() => {
              onDateStartChange('');
              onDateEndChange('');
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Shared: Pagination ────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  label,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  label?: string;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} {label ?? 'records'} total
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
  );
}

// ── View modal: User detail (for Requests section) ────────────────────────────

function UserDetailModal({ userID, onClose }: { userID: string; onClose: () => void }) {
  const [detail, setDetail] = useState<UserDetailForCashier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    topUpRequestService
      .getUserDetailForCashier(userID)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userID]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Customer Detail
          </h2>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3f6f64] border-t-transparent" />
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-lg font-semibold text-foreground">{detail.full_name}</p>
                <p className="text-sm text-muted-foreground">Customer wallet summary</p>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-semibold text-foreground">
                    {peso(detail.current_balance)}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Weekly Spend</span>
                  <span className="font-medium text-foreground">
                    {peso(detail.avg_weekly_spend)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Failed to load customer details.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6">
          <Button variant="outline" onClick={onClose} className="h-10 w-full rounded-lg">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Accept confirm modal ──────────────────────────────────────────────────────

function AcceptModal({
  row,
  onClose,
  onConfirm,
}: {
  row: CashierRequestRow;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Confirm Top-Up</h2>

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
            Has <span className="font-semibold text-foreground">{row.full_name}</span> paid the
            following amount in cash?
          </p>

          <div className="rounded-xl border bg-muted/30 p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{peso(row.amount)}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Confirming will credit the customer wallet immediately.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg"
            disabled={confirming}
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="h-10 flex-1 rounded-lg bg-green-600 text-white hover:bg-green-500"
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────

const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: 'cancelled_upon_payment', label: 'Cancelled upon payment' },
  { value: 'wrong_request', label: 'Wrong request' },
  { value: 'other', label: 'Other' },
];

function RejectModal({
  row,
  onClose,
  onConfirm,
}: {
  row: CashierRequestRow;
  onClose: () => void;
  onConfirm: (reason: RejectionReason, comment: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<RejectionReason | ''>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason.');
      return;
    }

    if (reason === 'other' && !comment.trim()) {
      setError('Please enter a comment.');
      return;
    }

    setError(null);
    setSubmitting(true);

    await onConfirm(reason as RejectionReason, comment);

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Reject Request</h2>

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
            Rejecting top-up of{' '}
            <span className="font-semibold text-foreground">{peso(row.amount)}</span> for{' '}
            <span className="font-semibold text-foreground">{row.full_name}</span>.
          </p>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reason
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {REJECTION_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setReason(r.value);
                    setError(null);
                  }}
                  className={`
                    rounded-lg border px-3 py-2.5 text-left text-sm transition-colors
                    ${
                      reason === r.value
                        ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-muted bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }
                  `}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {reason === 'other' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Comment</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter the reason for rejection…"
                className="w-full resize-none rounded-lg border bg-white p-3 text-sm text-foreground outline-none focus:border-muted-foreground"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg"
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="h-10 flex-1 rounded-lg bg-red-600 text-white hover:bg-red-500"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── View modal: Rejected detail ───────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  cancelled_upon_payment: 'Cancelled upon payment',
  wrong_request: 'Wrong request',
  other: 'Other',
};

function RejectedDetailModal({ row, onClose }: { row: CashierRejectedRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Rejection Detail
          </h2>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 flex flex-col gap-3">
          <DetailRow label="Customer">{row.full_name}</DetailRow>
          <DetailRow label="Amount">{peso(row.amount)}</DetailRow>
          <DetailRow label="Date">{fmtDate(row.created_at)}</DetailRow>
          <DetailRow label="Processed by">{row.cashier_name || '—'}</DetailRow>

          <div className="mt-2 rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rejection Reason
            </p>

            <p className="mt-2 text-sm font-medium text-foreground">
              {REASON_LABELS[row.rejection_reason] ?? row.rejection_reason}
            </p>

            {row.rejection_comment && (
              <p className="mt-2 text-xs text-muted-foreground italic">"{row.rejection_comment}"</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <Button variant="outline" onClick={onClose} className="h-10 w-full rounded-lg">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── View modal: Completed detail ──────────────────────────────────────────────

function CompletedDetailModal({ row, onClose }: { row: CashierCompletedRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Transaction Detail
          </h2>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 flex flex-col gap-3">
          <DetailRow label="Customer">{row.full_name}</DetailRow>

          <DetailRow label="Amount">
            <span className="font-semibold text-green-600">{peso(row.amount)}</span>
          </DetailRow>

          <DetailRow label="Date">{fmtDate(row.created_at)}</DetailRow>
          <DetailRow label="Cashier">{row.cashier_name || '—'}</DetailRow>

          <div className="mt-2 rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Balance Snapshot
            </p>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Before</span>
              <span className="font-medium text-foreground">{peso(row.balance_before)}</span>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">After</span>
              <span className="font-semibold text-green-600">{peso(row.balance_after)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6">
          <Button variant="outline" onClick={onClose} className="h-10 w-full rounded-lg">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

// ── Section: Requests ─────────────────────────────────────────────────────────

function RequestsSection({ onActionComplete }: { onActionComplete: () => void }) {
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<CashierRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [viewUserID, setViewUserID] = useState<string | null>(null);
  const [acceptRow, setAcceptRow] = useState<CashierRequestRow | null>(null);
  const [rejectRow, setRejectRow] = useState<CashierRequestRow | null>(null);

  const { toasts, push, dismiss } = useToast();

  const debouncedSearch = useDebounce(search, 400);

  const fetch = useCallback(async () => {
    setLoading(true);

    try {
      const res = await topUpRequestService.listPendingRequests(
        page,
        debouncedSearch,
        dateStart || undefined,
        dateEnd || undefined,
      );

      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      /* silently */
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, dateStart, dateEnd]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateStart, dateEnd]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const id = setInterval(() => fetch(), 15000);
    return () => clearInterval(id);
  }, [fetch]);

  const handleAccept = async () => {
    if (!acceptRow) return;

    const res = await topUpRequestService.acceptRequest(acceptRow.id);

    if (res.success) {
      push('success', `Top-up of ${peso(acceptRow.amount)} for ${acceptRow.full_name} approved.`);
      setAcceptRow(null);
      fetch();
      onActionComplete();
      return;
    }

    push('error', res.error?.message ?? 'Failed to accept request.');
    setAcceptRow(null);
  };

  const handleReject = async (reason: RejectionReason, comment: string) => {
    if (!rejectRow) return;

    const res = await topUpRequestService.rejectRequest(rejectRow.id, reason, comment);

    if (res.success) {
      push('success', `Request from ${rejectRow.full_name} rejected.`);
      setRejectRow(null);
      fetch();
      onActionComplete();
      return;
    }

    push('error', res.error?.message ?? 'Failed to reject request.');
    setRejectRow(null);
  };

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <SectionFilters
        search={search}
        onSearchChange={setSearch}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
      />

      {/* Table */}
      <div className="mt-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
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
            ) : data.length ? (
              data.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {fmtDate(row.created_at)}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-sm font-medium">{row.full_name}</TableCell>

                  <TableCell className="px-5 py-4 text-sm font-semibold">
                    {peso(row.amount)}
                  </TableCell>

                  <TableCell className="px-5 py-4 align-middle text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg"
                        onClick={() => setViewUserID(row.user_id)}
                      >
                        View
                      </Button>

                      <Button
                        size="sm"
                        className="h-9 rounded-lg border-green-500/30 bg-green-500/5 text-green-500 hover:bg-green-500/10"
                        onClick={() => setAcceptRow(row)}
                      >
                        Accept
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10"
                        onClick={() => setRejectRow(row)}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Inbox className="h-6 w-6 text-[#3f6f64]" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">No pending requests</p>
                      <p className="text-xs text-muted-foreground">
                        New top-up requests will appear here automatically.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        label="requests"
        onPageChange={setPage}
      />

      {/* Modals */}
      {viewUserID && <UserDetailModal userID={viewUserID} onClose={() => setViewUserID(null)} />}

      {acceptRow && (
        <AcceptModal row={acceptRow} onClose={() => setAcceptRow(null)} onConfirm={handleAccept} />
      )}

      {rejectRow && (
        <RejectModal row={rejectRow} onClose={() => setRejectRow(null)} onConfirm={handleReject} />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ── Section: Rejected ─────────────────────────────────────────────────────────

function RejectedSection() {
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<CashierRejectedRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [viewRow, setViewRow] = useState<CashierRejectedRow | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetch = useCallback(async () => {
    setLoading(true);

    try {
      const res = await topUpRequestService.listRejectedRequests(
        page,
        debouncedSearch,
        dateStart || undefined,
        dateEnd || undefined,
      );

      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      /* silently */
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, dateStart, dateEnd]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateStart, dateEnd]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="flex flex-col">
      <SectionFilters
        search={search}
        onSearchChange={setSearch}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
      />

      <div className="mt-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reason
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32">
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3f6f64] border-t-transparent" />
                    Loading rejected requests...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length ? (
              data.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {fmtDate(row.created_at)}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-sm font-medium">{row.full_name}</TableCell>

                  <TableCell className="px-5 py-4 text-sm font-semibold">
                    {peso(row.amount)}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {REASON_LABELS[row.rejection_reason] ?? row.rejection_reason}
                  </TableCell>

                  <TableCell className="px-5 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg"
                      onClick={() => setViewRow(row)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Inbox className="h-6 w-6 text-[#3f6f64]" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">No rejected requests</p>
                      <p className="text-xs text-muted-foreground">
                        Rejected top-ups will be recorded here for auditing.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        label="records"
        onPageChange={setPage}
      />

      {viewRow && <RejectedDetailModal row={viewRow} onClose={() => setViewRow(null)} />}
    </div>
  );
}

// ── Section: Completed ────────────────────────────────────────────────────────

function CompletedSection() {
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<CashierCompletedRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [viewRow, setViewRow] = useState<CashierCompletedRow | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetch = useCallback(async () => {
    setLoading(true);

    try {
      const res = await topUpRequestService.listCompletedRequests(
        page,
        debouncedSearch,
        dateStart || undefined,
        dateEnd || undefined,
      );

      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      /* silently */
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, dateStart, dateEnd]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateStart, dateEnd]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="flex flex-col">
      <SectionFilters
        search={search}
        onSearchChange={setSearch}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
      />

      <div className="mt-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cashier
              </TableHead>
              <TableHead className="h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32">
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3f6f64] border-t-transparent" />
                    Loading completed transactions...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length ? (
              data.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {fmtDate(row.created_at)}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-sm font-medium">{row.full_name}</TableCell>

                  <TableCell className="px-5 py-4 text-sm font-semibold text-green-600">
                    {peso(row.amount)}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                    {row.cashier_name || '—'}
                  </TableCell>

                  <TableCell className="px-5 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg"
                      onClick={() => setViewRow(row)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Inbox className="h-6 w-6 text-[#3f6f64]" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">No completed transactions</p>
                      <p className="text-xs text-muted-foreground">
                        Approved top-ups will appear here automatically.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        label="records"
        onPageChange={setPage}
      />

      {viewRow && <CompletedDetailModal row={viewRow} onClose={() => setViewRow(null)} />}
    </div>
  );
}

// ── Tab component ─────────────────────────────────────────────────────────────

type SectionTab = 'requests' | 'rejected' | 'completed';

const SECTION_TABS: { id: SectionTab; label: string }[] = [
  { id: 'requests', label: 'Requests' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'completed', label: 'Completed' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export const CashierTopUpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SectionTab>('requests');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionComplete = () => setRefreshKey((k) => k + 1);

  return (
    <div className="w-full px-1">
      <main className="flex flex-col gap-5">
        {/* ───────────────── Header ───────────────── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">Top-Up</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review and process customer wallet top-up requests.
            </p>
          </div>

          {/* Optional summary badge */}
          {/* <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full bg-[#cd9a34] px-3 py-1 text-xs font-semibold text-white">
              Cashier Panel
            </div>
          </div> */}
        </div>

        {/* ───────────────── Connected Tabs + Content ───────────────── */}
        <div className="flex flex-col gap-0">
          {/* Tabs */}
          <div className="flex items-center gap-0">
            <div className="flex items-center gap-1 bg-transparent p-0">
              {SECTION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative rounded-t-xl rounded-b-none
                    px-5 py-2.5 text-sm font-medium
                    transition-none

                    ${
                      activeTab === tab.id
                        ? 'z-10 bg-white text-foreground border border-border border-b-white'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connected Surface */}
          <div className="rounded-b-2xl rounded-tr-2xl border bg-white overflow-hidden">
            {/* Filters + Table wrapper */}
            <div className="p-6">
              <div className="bg-white border border-muted rounded-xl overflow-hidden">
                {/* Section Content */}
                <div className="border-b p-5">
                  {activeTab === 'requests' && (
                    <RequestsSection
                      key={`req-${refreshKey}`}
                      onActionComplete={handleActionComplete}
                    />
                  )}

                  {activeTab === 'rejected' && <RejectedSection key={`rej-${refreshKey}`} />}

                  {activeTab === 'completed' && <CompletedSection key={`com-${refreshKey}`} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// import { useState } from 'react';
// import { topupService, type TopupData } from '../../services/topup.service';
// import { userService, type UserData } from '../../services/user.service';
// import { ReceiptModal } from './components/Reciept';
// import { TopUpForm } from './components/TopUpForm';
// import type { TopupInput } from './schemas/topup.schema';

// export const CashierTopUpPage: React.FC = () => {
//   const [serverError, setServerError] = useState<string | null>(null);
//   const [receipt, setReceipt] = useState<TopupData | null>(null);
//   const [receiptUser, setReceiptUser] = useState<UserData | null>(null);
//   const [formKey, setFormKey] = useState(0); // increment to reset form

//   const handleTopup = async (data: TopupInput) => {
//     setServerError(null);

//     const response = await topupService.submitTopup(data);

//     if (!response.success) {
//       setServerError(response.error?.message ?? 'Something went wrong.');
//       return;
//     }

//     // Fetch user details for receipt
//     try {
//       const user = await userService.getUserById(response.data!.user_id);
//       setReceiptUser(user);
//       setReceipt(response.data!);
//     } catch {
//       // Top-up succeeded — still show receipt with fallback name
//       setReceiptUser({
//         user_id: response.data!.user_id,
//         first_name: 'Unknown',
//         middle_name: '',
//         last_name: 'User',
//       });
//       setReceipt(response.data!);
//     }
//   };

//   const handleClose = () => {
//     setReceipt(null);
//     setReceiptUser(null);
//     setFormKey((k) => k + 1); // resets the form
//   };

//   return (
//     <div className="px-1 w-full">
//       <main className="flex flex-col w-full h-full gap-4">
//         <h1 className="text-2xl font-semibold">Top-Up</h1>
//         {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
//         <TopUpForm key={formKey} onSubmit={handleTopup} />
//       </main>

//       {receipt && receiptUser && (
//         <ReceiptModal receipt={receipt} user={receiptUser} onClose={handleClose} />
//       )}
//     </div>
//   );
// };
