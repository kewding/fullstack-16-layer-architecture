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
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  PhilippinePeso,
  X,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  topUpRequestService,
  type PendingRequest,
  type TopUpHistoryRow,
} from './services/topup.services';

// ── helpers ───────────────────────────────────────────────────────────────────

function peso(v: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);
}

function fmtDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy · h:mm a');
}

// ── Toast notification ────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  const styles: Record<
    ToastType,
    {
      icon: React.ReactNode;
      wrapper: string;
      iconWrap: string;
      iconColor: string;
    }
  > = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      wrapper: 'border-[#d6ede9] bg-white',
      iconWrap: 'bg-[#d6ede9]',
      iconColor: 'text-[#3f6f64]',
    },

    error: {
      icon: <XCircle className="w-4 h-4" />,
      wrapper: 'border-red-200 bg-white',
      iconWrap: 'bg-red-100',
      iconColor: 'text-red-600',
    },

    info: {
      icon: <AlertCircle className="w-4 h-4" />,
      wrapper: 'border-blue-200 bg-white',
      iconWrap: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => {
        const cfg = styles[t.type];

        return (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 p-4 rounded-2xl shadow-2xl border
              pointer-events-auto transition-all duration-300
              min-w-[320px] max-w-sm backdrop-blur-sm
              ${cfg.wrapper}
            `}
          >
            {/* Icon */}
            <div
              className={`
                shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                ${cfg.iconWrap}
              `}
            >
              <span className={cfg.iconColor}>{cfg.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm leading-snug text-[hsl(var(--foreground))]">{t.message}</p>
            </div>

            {/* Close */}
            <button
              onClick={() => onDismiss(t.id)}
              className="
                shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                text-muted-foreground hover:bg-[hsl(var(--muted))]
                hover:text-[hsl(var(--foreground))]
                transition-colors
              "
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    {
      label: string;
      badge: string;
      iconBg: string;
      iconColor: string;
      icon: React.ReactNode;
    }
  > = {
    accepted: {
      label: 'Accepted',
      badge: 'bg-[#d6ede9] text-[#3f6f64]',
      iconBg: 'bg-[#d6ede9]',
      iconColor: 'text-[#3f6f64]',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },

    rejected: {
      label: 'Rejected',
      badge: 'bg-red-100 text-red-700',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: <XCircle className="w-3 h-3" />,
    },

    cancelled: {
      label: 'Cancelled',
      badge: 'bg-slate-100 text-slate-700',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      icon: <Ban className="w-3 h-3" />,
    },

    pending: {
      label: 'Pending',
      badge: 'bg-[#fdf3de] text-[#a07520]',
      iconBg: 'bg-[#fdf3de]',
      iconColor: 'text-[#cd9a34]',
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const cfg = map[status] ?? map.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}
    >
      <span className={cfg.iconColor}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ── Rejection reason label ────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  cancelled_upon_payment: 'Cancelled upon payment',
  wrong_request: 'Wrong request',
  other: 'Other',
};

// ── Simple date range picker (reusing project pattern) ────────────────────────

interface DateRange {
  start: string;
  end: string;
}

function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">From</label>

        <Input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="h-9 bg-white"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">To</label>

        <Input
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="h-9 bg-white"
        />
      </div>

      {(value.start || value.end) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ start: '', end: '' })}
          className="h-9 text-xs text-muted-foreground"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground px-1 mt-4">
      <span>
        {total} record{total !== 1 ? 's' : ''} total
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="border-[hsl(var(--border))]"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-xs">
          Page {page} of {totalPages === 0 ? 1 : totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="border-[hsl(var(--border))]"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── View detail modal ─────────────────────────────────────────────────────────

function HistoryDetailModal({ row, onClose }: { row: TopUpHistoryRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-[hsl(var(--border))] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Transaction Detail
            </h2>

            <p className="text-xs text-muted-foreground mt-0.5">
              Review top-up transaction information
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <StatusBadge status={row.status} />
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-[hsl(var(--foreground))]">
                {peso(row.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">Date</span>
              <span className="text-sm text-[hsl(var(--foreground))]">
                {fmtDate(row.created_at)}
              </span>
            </div>

            {row.cashier_name && (
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">Processed by</span>

                <span className="text-sm text-[hsl(var(--foreground))]">{row.cashier_name}</span>
              </div>
            )}
          </div>

          {row.status === 'accepted' && row.balance_before != null && (
            <div className="rounded-xl border border-[#d6ede9] bg-[#eef8f5] p-4">
              <p className="text-xs font-semibold text-[#3f6f64] mb-3">Balance Snapshot</p>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Before</span>
                <span>{peso(row.balance_before)}</span>
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">After</span>

                <span className="font-semibold text-[#3f6f64]">{peso(row.balance_after ?? 0)}</span>
              </div>
            </div>
          )}

          {row.status === 'rejected' && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 mb-2">Rejection Details</p>

              <p className="text-sm text-red-700">
                {REASON_LABELS[row.rejection_reason ?? ''] ?? row.rejection_reason}
              </p>

              {row.rejection_comment && (
                <p className="text-xs text-red-500 italic mt-2">"{row.rejection_comment}"</p>
              )}
            </div>
          )}

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-[hsl(var(--border))]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
//   return (
//     <div className="flex items-center justify-between">
//       <span className="text-xs text-neutral-500">{label}</span>
//       <div>{children}</div>
//     </div>
//   );
// }

// ── Main page ─────────────────────────────────────────────────────────────────

export const UserTopUpPage: React.FC = () => {
  const { toasts, push, dismiss } = useToast();

  // ── Request form state ──────────────────────────────────────────────────────
  const [amountInput, setAmountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Pending request ─────────────────────────────────────────────────────────
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // ── History table ───────────────────────────────────────────────────────────
  const [history, setHistory] = useState<TopUpHistoryRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [selectedRow, setSelectedRow] = useState<TopUpHistoryRow | null>(null);

  // ── Fetch pending ───────────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await topUpRequestService.getPendingRequest();
      setPending(res.data ?? null);
    } catch {
      // silently fail — page still loads
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // ── Fetch history ───────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await topUpRequestService.listHistory(
        historyPage,
        dateRange.start || undefined,
        dateRange.end || undefined,
      );
      setHistory(res.data);
      setHistoryTotal(res.total);
      setHistoryTotalPages(res.total_pages);
    } catch {
      push('error', 'Failed to load transaction history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, dateRange, push]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  useEffect(() => {
    setHistoryPage(1);
  }, [dateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ── Submit request ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError(null);
    const amount = parseFloat(amountInput);
    if (!amountInput || isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    if (amount > 5000) {
      setFormError('Maximum top-up request is ₱5,000.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await topUpRequestService.submitRequest(amount);
      if (res.success && res.data) {
        setPending(res.data);
        setAmountInput('');
        push('success', `Top-up request of ${peso(amount)} submitted successfully.`);
      } else {
        const msgs: Record<string, string> = {
          pending_request_exists:
            'You already have a pending request. Please wait or cancel it first.',
          wallet_limit_exceeded: 'This amount would exceed your maximum wallet balance of ₱50,000.',
          validation_error: 'Please enter a valid amount between ₱1 and ₱5,000.',
        };
        setFormError(msgs[res.error?.code ?? ''] ?? res.error?.message ?? 'Something went wrong.');
      }
    } catch {
      setFormError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancel request ──────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!pending) return;
    setCancelling(true);
    try {
      const res = await topUpRequestService.cancelRequest(pending.id);
      if (res.success) {
        setPending(null);
        setConfirmCancel(false);
        push('info', 'Your top-up request has been cancelled.');
        fetchHistory();
      } else {
        push('error', res.error?.message ?? 'Failed to cancel request.');
        setConfirmCancel(false);
      }
    } catch {
      push('error', 'A network error occurred.');
    } finally {
      setCancelling(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-4 py-4 lg:px-6 lg:py-6">
      <main className="flex w-full flex-col gap-8">
        {/* Header */}
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
            Top-Up Wallet
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Request wallet top-ups and review your transaction history.
          </p>
        </section>

        {/* Top Section */}
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          {/* Request Card */}
          <section className="flex-1 overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-white shadow-sm">
            <div className="flex items-start gap-4 border-b border-[hsl(var(--border))] px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d6ede9]">
                <PhilippinePeso className="h-4 w-4 text-[#3f6f64]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Request Top-Up
                </h2>

                <p className="text-xs leading-5 text-muted-foreground">
                  Maximum ₱5,000 per request · Wallet cap ₱50,000
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <PhilippinePeso className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    type="number"
                    min={1}
                    max={5000}
                    step="0.01"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      setFormError(null);
                    }}
                    disabled={!!pending || submitting}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className={`
                    h-11 pl-9
                    bg-white
                    ${formError ? 'border-red-400' : ''}
                  `}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!!pending || submitting || !amountInput}
                  className="h-11 px-6 bg-[#3f6f64] hover:bg-[#355c53]"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request'}
                </Button>
              </div>

              {formError && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-6">{formError}</span>
                </div>
              )}

              {pending && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#f3d9a4] bg-[#fdf3de] px-4 py-3 text-sm text-[#a07520]">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="leading-6">
                    You have a pending request. Cancel it below to submit a new one.
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Pending Card */}
          {pendingLoading ? (
            <div className="flex flex-1 h-32 items-center justify-center rounded-3xl border border-[hsl(var(--border))] bg-white shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-[#3f6f64]" />
            </div>
          ) : pending ? (
            <section className="flex-1 overflow-hidden rounded-3xl border border-[#f3d9a4] bg-[#fffaf0] shadow-sm">
              <div className="flex items-start justify-between border-b border-[#f3d9a4] px-6 py-5">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a07520]">
                    Pending Request
                  </p>

                  <p className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                    {peso(pending.amount)}
                  </p>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Submitted {fmtDate(pending.created_at)}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fdf3de]">
                  <Clock className="h-5 w-5 text-[#cd9a34]" />
                </div>
              </div>

              <div className="p-6">
                {!confirmCancel ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmCancel(true)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Cancel Request
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">Cancel this request?</span>

                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={cancelling}
                      onClick={handleCancel}
                    >
                      {cancelling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Yes, Cancel'
                      )}
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => setConfirmCancel(false)}>
                      No
                    </Button>
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>

        {/* History */}
        <section className="overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-white shadow-sm">
          <div className="flex flex-col gap-6 border-b border-[hsl(var(--border))] px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Transaction History
              </h2>

              <p className="text-xs leading-5 text-muted-foreground">
                All completed, rejected and cancelled requests
              </p>
            </div>

            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[hsl(var(--border))] hover:bg-transparent">
                  <TableHead className="w-[32%] px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Date
                  </TableHead>

                  <TableHead className="w-[18%] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Amount
                  </TableHead>

                  <TableHead className="w-[20%] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Status
                  </TableHead>

                  <TableHead className="w-[20%] px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Cashier
                  </TableHead>

                  <TableHead className="w-[10%] px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#3f6f64]" />
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-24 text-center text-sm text-muted-foreground"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow
                      key={row.id}
                      className="
                      border-b border-[hsl(var(--border))]
                      transition-colors
                      hover:bg-[hsl(var(--muted))]/30
                    "
                    >
                      <TableCell className="px-6 py-5 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-[hsl(var(--foreground))]">
                            {format(new Date(row.created_at), 'MMM d, yyyy')}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {format(new Date(row.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-5 py-5 align-middle">
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {peso(row.amount)}
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-5 align-middle">
                        <StatusBadge status={row.status} />
                      </TableCell>

                      <TableCell className="px-5 py-5 align-middle">
                        {row.cashier_name ? (
                          <span className="text-sm text-muted-foreground">{row.cashier_name}</span>
                        ) : (
                          <span className="text-sm italic text-slate-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="px-6 py-5 text-right align-middle">
                        <Button
                          variant="outline"
                          size="sm"
                          className="
                          h-8 px-3 text-xs
                          border-[hsl(var(--border))]
                          hover:bg-[hsl(var(--muted))]
                        "
                          onClick={() => setSelectedRow(row)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="px-6 py-5">
            <Pagination
              page={historyPage}
              totalPages={historyTotalPages}
              total={historyTotal}
              onPageChange={setHistoryPage}
            />
          </div>
        </section>

        {selectedRow && (
          <HistoryDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </main>
    </div>
  );
};
