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
          ${t.type === 'success' ? 'bg-neutral-900 border-green-500/40' : 'bg-neutral-900 border-red-500/40'}`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
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
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name…"
          className="pl-9 h-9 text-sm bg-neutral-900 border-neutral-700"
        />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-neutral-500">From</label>
          <Input
            type="date"
            value={dateStart}
            onChange={(e) => onDateStartChange(e.target.value)}
            className="h-9 text-sm bg-neutral-900 border-neutral-700 w-36"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-neutral-500">To</label>
          <Input
            type="date"
            value={dateEnd}
            onChange={(e) => onDateEndChange(e.target.value)}
            className="h-9 text-sm bg-neutral-900 border-neutral-700 w-36"
          />
        </div>
        {(dateStart || dateEnd) && (
          <button
            onClick={() => {
              onDateStartChange('');
              onDateEndChange('');
            }}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 pb-0.5"
          >
            <X className="w-3 h-3" /> Clear
          </button>
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
    <div className="flex items-center justify-between text-sm text-neutral-500 px-1 mt-3">
      <span>
        {total} {label ?? 'record'}
        {total !== 1 ? 's' : ''}
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
          Page {page} of {Math.max(totalPages, 1)}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Customer Detail</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
          </div>
        ) : detail ? (
          <div className="flex flex-col gap-3">
            <p className="text-lg font-semibold text-white">{detail.full_name}</p>
            <div className="flex flex-col gap-2 bg-neutral-800/50 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Current Balance</span>
                <span className="text-white font-semibold">{peso(detail.current_balance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Avg. Weekly Spend</span>
                <span className="text-white">{peso(detail.avg_weekly_spend)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 text-center py-4">Failed to load details.</p>
        )}
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Confirm Top-Up</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-400">
            Has <strong className="text-white">{row.full_name}</strong> paid the following amount in
            cash?
          </p>
          <div className="bg-neutral-800/60 rounded-xl p-4 text-center">
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Amount</p>
            <p className="text-3xl font-bold text-white">{peso(row.amount)}</p>
          </div>
          <p className="text-xs text-neutral-500">
            Clicking confirm will credit this amount to the customer's wallet and cannot be undone
            without a reject.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={confirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 bg-green-500 text-black hover:bg-green-400 font-semibold"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Reject Request</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-neutral-400">
            Rejecting top-up of <strong className="text-white">{peso(row.amount)}</strong> for{' '}
            <strong className="text-white">{row.full_name}</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400 font-medium">Reason</label>
            <div className="flex flex-col gap-2">
              {REJECTION_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => {
                    setReason(r.value);
                    setError(null);
                  }}
                  className={`text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${
                    reason === r.value
                      ? 'border-red-500/60 bg-red-500/10 text-red-300'
                      : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {reason === 'other' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-400 font-medium">Comment</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter the reason for rejection…"
                className="w-full text-sm bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-neutral-500"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            variant="destructive"
            className="flex-1"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Rejection Detail</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <DetailRow label="Customer">{row.full_name}</DetailRow>
          <DetailRow label="Amount">{peso(row.amount)}</DetailRow>
          <DetailRow label="Date">{fmtDate(row.created_at)}</DetailRow>
          <DetailRow label="Processed by">{row.cashier_name || '—'}</DetailRow>
          <div className="border-t border-neutral-800 pt-3">
            <p className="text-xs text-neutral-500 mb-2">Rejection Reason</p>
            <p className="text-sm text-white">
              {REASON_LABELS[row.rejection_reason] ?? row.rejection_reason}
            </p>
            {row.rejection_comment && (
              <p className="text-xs text-neutral-400 mt-1 italic">"{row.rejection_comment}"</p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
}

// ── View modal: Completed detail ──────────────────────────────────────────────

function CompletedDetailModal({ row, onClose }: { row: CashierCompletedRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Transaction Detail</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <DetailRow label="Customer">{row.full_name}</DetailRow>
          <DetailRow label="Amount">
            <span className="text-green-400 font-semibold">{peso(row.amount)}</span>
          </DetailRow>
          <DetailRow label="Date">{fmtDate(row.created_at)}</DetailRow>
          <DetailRow label="Cashier">{row.cashier_name || '—'}</DetailRow>
          <div className="border-t border-neutral-800 pt-3">
            <p className="text-xs text-neutral-500 mb-2">Balance Snapshot</p>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Before</span>
              <span className="text-white">{peso(row.balance_before)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-neutral-400">After</span>
              <span className="text-green-400 font-semibold">{peso(row.balance_after)}</span>
            </div>
          </div>
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
      <span className="text-sm text-white">{children}</span>
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

  // Auto-refresh every 15 s to pick up new requests
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
    } else {
      push('error', res.error?.message ?? 'Failed to accept request.');
      setAcceptRow(null);
    }
  };

  const handleReject = async (reason: RejectionReason, comment: string) => {
    if (!rejectRow) return;
    const res = await topUpRequestService.rejectRequest(rejectRow.id, reason, comment);
    if (res.success) {
      push('success', `Request from ${rejectRow.full_name} rejected.`);
      setRejectRow(null);
      fetch();
      onActionComplete();
    } else {
      push('error', res.error?.message ?? 'Failed to reject request.');
      setRejectRow(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionFilters
        search={search}
        onSearchChange={setSearch}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
      />

      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 bg-neutral-900/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Date
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Amount
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-500" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-neutral-500">
                  No pending requests.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="border-neutral-800 hover:bg-neutral-900/40">
                  <TableCell className="text-sm text-neutral-400">
                    {fmtDate(row.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-white">{row.full_name}</TableCell>
                  <TableCell className="text-sm font-semibold text-white">
                    {peso(row.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-neutral-700"
                        onClick={() => setViewUserID(row.user_id)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-green-500 text-black hover:bg-green-400"
                        onClick={() => setAcceptRow(row)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => setRejectRow(row)}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        label="request"
        onPageChange={setPage}
      />

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
    <div className="flex flex-col gap-3">
      <SectionFilters
        search={search}
        onSearchChange={setSearch}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
      />

      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 bg-neutral-900/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Date
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Amount
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Reason
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-500" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-neutral-500">
                  No rejected requests.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="border-neutral-800 hover:bg-neutral-900/40">
                  <TableCell className="text-sm text-neutral-400">
                    {fmtDate(row.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-white">{row.full_name}</TableCell>
                  <TableCell className="text-sm font-semibold text-white">
                    {peso(row.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {REASON_LABELS[row.rejection_reason] ?? row.rejection_reason}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-neutral-700"
                      onClick={() => setViewRow(row)}
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
        page={page}
        totalPages={totalPages}
        total={total}
        label="record"
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
    <div className="flex flex-col gap-3">
      <SectionFilters
        search={search}
        onSearchChange={setSearch}
        dateStart={dateStart}
        dateEnd={dateEnd}
        onDateStartChange={setDateStart}
        onDateEndChange={setDateEnd}
      />

      <div className="rounded-lg border border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-neutral-800 bg-neutral-900/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Date
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Amount
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Cashier
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-500"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-500" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-neutral-500">
                  No completed transactions.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="border-neutral-800 hover:bg-neutral-900/40">
                  <TableCell className="text-sm text-neutral-400">
                    {fmtDate(row.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-white">{row.full_name}</TableCell>
                  <TableCell className="text-sm font-semibold text-green-400">
                    {peso(row.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-400">
                    {row.cashier_name || '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-neutral-700"
                      onClick={() => setViewRow(row)}
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
        page={page}
        totalPages={totalPages}
        total={total}
        label="record"
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
  // Key to force re-render the Rejected/Completed sections after an action
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionComplete = () => setRefreshKey((k) => k + 1);

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-5">
        <h1 className="text-2xl font-semibold">Top-Up</h1>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/40 p-1 self-start">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Section content */}
        {activeTab === 'requests' && (
          <RequestsSection key={`req-${refreshKey}`} onActionComplete={handleActionComplete} />
        )}
        {activeTab === 'rejected' && <RejectedSection key={`rej-${refreshKey}`} />}
        {activeTab === 'completed' && <CompletedSection key={`com-${refreshKey}`} />}
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
