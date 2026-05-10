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
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border pointer-events-auto
            transition-all duration-300 min-w-[300px] max-w-sm
            ${t.type === 'success' ? 'bg-neutral-900 border-green-500/40 text-green-400' : ''}
            ${t.type === 'error' ? 'bg-neutral-900 border-red-500/40 text-red-400' : ''}
            ${t.type === 'info' ? 'bg-neutral-900 border-blue-500/40 text-blue-400' : ''}
          `}
        >
          {t.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {t.type === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
          {t.type === 'info' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <p className="text-sm text-white flex-1">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="text-neutral-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
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
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    accepted: {
      label: 'Accepted',
      className: 'bg-green-500/10 text-green-400 border-green-500/30',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: <XCircle className="w-3 h-3" />,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
      icon: <Ban className="w-3 h-3" />,
    },
    pending: {
      label: 'Pending',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: <Clock className="w-3 h-3" />,
    },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.className}`}
    >
      {cfg.icon}
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
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-neutral-500">From</label>
        <Input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="h-9 text-sm bg-neutral-900 border-neutral-700"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-neutral-500">To</label>
        <Input
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="h-9 text-sm bg-neutral-900 border-neutral-700"
        />
      </div>
      {(value.start || value.end) && (
        <button
          onClick={() => onChange({ start: '', end: '' })}
          className="mt-4 text-xs text-neutral-400 hover:text-white flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear
        </button>
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
    <div className="flex items-center justify-between text-sm text-neutral-500 px-1 mt-3">
      <span>
        {total} record{total !== 1 ? 's' : ''} total
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Transaction Detail</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <DetailRow label="Status">
            <StatusBadge status={row.status} />
          </DetailRow>
          <DetailRow label="Amount">
            <span className="text-white font-semibold">{peso(row.amount)}</span>
          </DetailRow>
          <DetailRow label="Date">
            <span className="text-white text-sm">{fmtDate(row.created_at)}</span>
          </DetailRow>

          {row.cashier_name && (
            <DetailRow label="Processed by">
              <span className="text-white text-sm">{row.cashier_name}</span>
            </DetailRow>
          )}

          {/* Accepted: show balance snapshot */}
          {row.status === 'accepted' && row.balance_before != null && (
            <>
              <div className="border-t border-neutral-800 pt-3 mt-1">
                <p className="text-xs text-neutral-500 mb-2">Balance Snapshot</p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Before</span>
                  <span className="text-white">{peso(row.balance_before)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-neutral-400">After</span>
                  <span className="text-green-400 font-semibold">
                    {peso(row.balance_after ?? 0)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Rejected: show reason */}
          {row.status === 'rejected' && (
            <div className="border-t border-neutral-800 pt-3 mt-1">
              <p className="text-xs text-neutral-500 mb-2">Rejection Details</p>
              <p className="text-sm text-white">
                {REASON_LABELS[row.rejection_reason ?? ''] ?? row.rejection_reason}
              </p>
              {row.rejection_comment && (
                <p className="text-xs text-neutral-400 mt-1 italic">"{row.rejection_comment}"</p>
              )}
            </div>
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-500">{label}</span>
      <div>{children}</div>
    </div>
  );
}

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
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full gap-6">
        <h1 className="text-2xl font-semibold">Top-Up</h1>

        {/* ── Request form ─────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3 max-w-sm">
          <div>
            <h2 className="text-sm font-semibold text-neutral-300">Request Top-Up</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Maximum ₱5,000 per request · Wallet cap ₱50,000
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
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
                className={`pl-9 h-11 bg-neutral-900 border ${
                  formError ? 'border-red-500' : 'border-neutral-700'
                } disabled:opacity-50`}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!!pending || submitting || !amountInput}
              className="h-11 px-5 font-semibold"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request'}
            </Button>
          </div>

          {formError && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {formError}
            </p>
          )}

          {pending && (
            <p className="text-xs text-amber-400/80 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              You have a pending request. Cancel it below to submit a new one.
            </p>
          )}
        </section>

        {/* ── Pending request card ──────────────────────────────────────────── */}
        {pendingLoading ? (
          <div className="h-20 rounded-xl border border-neutral-800 flex items-center justify-center max-w-sm">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
          </div>
        ) : pending ? (
          <section className="max-w-sm rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-amber-400/80 font-medium uppercase tracking-wide mb-1">
                  Pending Request
                </p>
                <p className="text-2xl font-bold text-white">{peso(pending.amount)}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Submitted {fmtDate(pending.created_at)}
                </p>
              </div>
              <Clock className="w-5 h-5 text-amber-400/60 shrink-0 mt-1" />
            </div>

            {!confirmCancel ? (
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 self-start"
                onClick={() => setConfirmCancel(true)}
              >
                Cancel Request
              </Button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-neutral-400">Cancel this request?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Cancel'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmCancel(false)}>
                  No
                </Button>
              </div>
            )}
          </section>
        ) : null}

        {/* ── History table ─────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-300">Transaction History</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                All completed, rejected and cancelled requests
              </p>
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>

          <div className="rounded-lg border border-neutral-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 bg-neutral-900/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Cashier
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-500" />
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-sm text-neutral-500">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow key={row.id} className="border-neutral-800 hover:bg-neutral-900/40">
                      <TableCell className="text-sm text-neutral-400">
                        {fmtDate(row.created_at)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-white">
                        {peso(row.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-sm text-neutral-400">
                        {row.cashier_name ?? <span className="text-neutral-600 italic">—</span>}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 border-neutral-700"
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

          <Pagination
            page={historyPage}
            totalPages={historyTotalPages}
            total={historyTotal}
            onPageChange={setHistoryPage}
          />
        </section>
      </main>

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selectedRow && <HistoryDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />}

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
};
