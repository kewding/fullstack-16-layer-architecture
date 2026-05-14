// src/features/vendor/pages/VendorWithdrawPage.tsx

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
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  PhilippinePeso,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  REJECTION_REASON_LABELS,
  vendorWithdrawalService,
  type PendingWithdrawal,
  type WithdrawalHistoryRow,
} from './services/remittance.service';
// ── Preset amounts ────────────────────────────────────────────────────────────
const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

// ── Helpers ───────────────────────────────────────────────────────────────────
function peso(val: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(val);
}

function fmtDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy · h:mm a');
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        map[status] ?? 'bg-neutral-700 text-neutral-300 border-neutral-600'
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Detail Row helper ─────────────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-neutral-400 shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

// ── History detail modal ──────────────────────────────────────────────────────
function HistoryDetailModal({ row, onClose }: { row: WithdrawalHistoryRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Withdrawal Detail</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount */}
        <div className="bg-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Amount</p>
          <p
            className={`text-3xl font-bold ${
              row.status === 'completed' ? 'text-red-400' : 'text-neutral-300'
            }`}
          >
            -{peso(row.amount)}
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <DetailRow label="Status" value={<StatusBadge status={row.status} />} />
          <DetailRow label="Date" value={fmtDate(row.created_at)} />
          {row.cashier_name && <DetailRow label="Processed by" value={row.cashier_name} />}
          {row.status === 'completed' && row.balance_before != null && (
            <>
              <DetailRow label="Balance before" value={peso(row.balance_before)} />
              <DetailRow label="Balance after" value={peso(row.balance_after ?? 0)} />
            </>
          )}
          {row.status === 'rejected' && row.rejection_reason && (
            <DetailRow
              label="Rejection reason"
              value={REJECTION_REASON_LABELS[row.rejection_reason] ?? row.rejection_reason}
            />
          )}
          {row.rejection_comment && <DetailRow label="Comment" value={row.rejection_comment} />}
        </div>

        <Button
          onClick={onClose}
          className="w-full rounded-xl bg-white text-black hover:bg-neutral-200"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export const VendorWithdrawPage: React.FC = () => {
  // balance
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // form
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // pending
  const [pending, setPending] = useState<PendingWithdrawal | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // history
  const [history, setHistory] = useState<WithdrawalHistoryRow[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histTotalPages, setHistTotalPages] = useState(1);
  const [histPage, setHistPage] = useState(1);
  const [histLoading, setHistLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<WithdrawalHistoryRow | null>(null);

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const w = await vendorWithdrawalService.getBalance();
      setBalance(w.balance);
    } catch {
      /* silent */
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await vendorWithdrawalService.getPendingRequest();
      setPending(res.success ? (res.data ?? null) : null);
    } catch {
      setPending(null);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (page: number) => {
    setHistLoading(true);
    try {
      const res = await vendorWithdrawalService.listHistory(page);
      setHistory(res.data);
      setHistTotal(res.total);
      setHistTotalPages(res.total_pages);
    } catch {
      /* silent */
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);
  useEffect(() => {
    loadPending();
  }, [loadPending]);
  useEffect(() => {
    loadHistory(histPage);
  }, [loadHistory, histPage]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const effectiveAmount = selectedPreset !== null ? selectedPreset : parseFloat(customAmount) || 0;
  const maxAmount = balance ?? 0;
  const amountValid = effectiveAmount >= 1 && effectiveAmount <= maxAmount;
  const hasPending = !pendingLoading && pending !== null;

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!amountValid) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await vendorWithdrawalService.submitRequest(effectiveAmount);
    if (res.success) {
      setSelectedPreset(null);
      setCustomAmount('');
      await loadPending();
      await loadBalance();
    } else {
      const msgs: Record<string, string> = {
        pending_request_exists: 'You already have a pending withdrawal request.',
        amount_exceeds_balance: 'Amount exceeds your current wallet balance.',
        invalid_amount: 'Amount must be at least ₱1.',
      };
      setSubmitError(msgs[res.error?.code ?? ''] ?? 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  // ── Cancel ───────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!pending) return;
    setCancelling(true);
    const res = await vendorWithdrawalService.cancelRequest(pending.id);
    if (res.success) {
      setPending(null);
      await loadBalance();
    }
    setCancelling(false);
  };

  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full gap-6">
        <h1 className="text-2xl font-semibold">Withdraw</h1>

        {/* ── Top section: balance card + form/pending side by side ── */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Balance card */}
          <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-5 flex items-center justify-between lg:w-72 shrink-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-neutral-400 uppercase tracking-wider">
                Current Balance
              </span>
              {balanceLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400 mt-1" />
              ) : (
                <span className="text-2xl font-bold text-white flex items-center gap-1">
                  <PhilippinePeso className="w-5 h-5 text-neutral-400" />
                  {(balance ?? 0).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-red-400" />
            </div>
          </div>

          {/* Request form (disabled when pending exists) */}
          <div
            className={`flex-1 rounded-xl border bg-neutral-900 p-5 flex flex-col gap-4 transition-opacity ${
              hasPending
                ? 'border-neutral-700/50 opacity-50 pointer-events-none select-none'
                : 'border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Request Withdrawal</h2>
              {hasPending && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pending request active
                </span>
              )}
            </div>

            <p className="text-sm text-neutral-400">
              Select a preset or enter a custom amount. Maximum is your current balance.
            </p>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.filter((a) => a <= maxAmount).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(a);
                    setCustomAmount('');
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    selectedPreset === a
                      ? 'bg-white text-black border-white'
                      : 'border-neutral-600 text-neutral-300 hover:border-neutral-400 hover:text-white'
                  }`}
                >
                  {peso(a)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-400">Custom Amount</label>
              <Input
                type="number"
                min={1}
                max={maxAmount}
                placeholder="e.g. 750"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(null);
                }}
                className="bg-neutral-800 border-neutral-600 text-white"
              />
              {customAmount && parseFloat(customAmount) > maxAmount && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Exceeds your current balance of {peso(maxAmount)}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!amountValid || submitting || balanceLoading || hasPending}
              className="w-full rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 disabled:opacity-40"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </span>
              ) : (
                `Request ${effectiveAmount >= 1 ? peso(effectiveAmount) : ''} Withdrawal`
              )}
            </Button>
          </div>
        </div>

        {/* ── Pending request card ── */}
        {pendingLoading ? (
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking for pending requests…
          </div>
        ) : pending ? (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">Pending Withdrawal Request</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-bold text-white">{peso(pending.amount)}</span>
                <span className="text-xs text-neutral-500">{fmtDate(pending.created_at)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling}
                onClick={handleCancel}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-400"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
              </Button>
            </div>
            <p className="text-xs text-neutral-400">
              Your request is awaiting cashier processing. You can cancel it at any time before it
              is actioned.
            </p>
          </div>
        ) : null}

        {/* ── History table ── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Withdrawal History</h2>
          <div className="rounded-lg border border-neutral-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 bg-neutral-900">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Amount
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Cashier
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {histLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center">
                      <Loader2 className="mx-auto w-5 h-5 animate-spin text-neutral-400" />
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                      No withdrawal history yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow key={row.id} className="border-neutral-800 hover:bg-neutral-800/40">
                      <TableCell className="text-sm text-neutral-300">
                        {format(new Date(row.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-red-400">
                        -{peso(row.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-sm text-neutral-400">
                        {row.cashier_name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-neutral-700 text-neutral-300 hover:text-white"
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

          {/* Pagination */}
          {histTotal > 0 && (
            <div className="flex items-center justify-between text-sm text-neutral-500 px-1">
              <span>
                {histTotal} record{histTotal !== 1 ? 's' : ''} total
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={histPage <= 1}
                  onClick={() => setHistPage((p) => p - 1)}
                  className="border-neutral-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs">
                  Page {histPage} of {histTotalPages === 0 ? 1 : histTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={histPage >= histTotalPages}
                  onClick={() => setHistPage((p) => p + 1)}
                  className="border-neutral-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      {selectedRow && <HistoryDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
};
