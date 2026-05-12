import { useAuth } from '@/app/providers/AuthProvider';
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
import { userService } from '@/features/user/services/user.service';
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
  withdrawalService,
  type PendingWithdrawal,
  type WithdrawalHistoryRow,
} from './services/withdrawal.service';

// ── preset amounts ────────────────────────────────────────────────────────────
const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

// ── helpers ───────────────────────────────────────────────────────────────────
function peso(val: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
}

function fmtDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy · h:mm a');
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? 'bg-neutral-700 text-neutral-300 border-neutral-600'}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function HistoryDetailModal({ row, onClose }: { row: WithdrawalHistoryRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-2xl">
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
            className={`text-3xl font-bold ${row.status === 'completed' ? 'text-red-400' : 'text-neutral-300'}`}
          >
            -{peso(row.amount)}
          </p>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <Row label="Status" value={<StatusBadge status={row.status} />} />
          <Row label="Date" value={fmtDate(row.created_at)} />
          {row.cashier_name && <Row label="Processed by" value={row.cashier_name} />}
          {row.status === 'completed' && row.balance_before != null && (
            <>
              <Row label="Balance before" value={peso(row.balance_before)} />
              <Row label="Balance after" value={peso(row.balance_after ?? 0)} />
            </>
          )}
          {row.status === 'rejected' && row.rejection_reason && (
            <Row
              label="Rejection reason"
              value={
                REJECTION_REASON_LABELS[
                  row.rejection_reason as keyof typeof REJECTION_REASON_LABELS
                ] ?? row.rejection_reason
              }
            />
          )}
          {row.rejection_comment && <Row label="Comment" value={row.rejection_comment} />}
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-neutral-400 shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export const UserWithdrawPage: React.FC = () => {
  const { user } = useAuth();

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

  // ── load balance ────────────────────────────────────────────────────────────
  const loadBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const w = await userService.getWallet(user.id);
      setBalance(w.balance);
    } catch {
      /* silent */
    } finally {
      setBalanceLoading(false);
    }
  }, [user?.id]);

  // ── load pending ────────────────────────────────────────────────────────────
  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await withdrawalService.getPendingRequest();
      setPending(res.success ? (res.data ?? null) : null);
    } catch {
      setPending(null);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // ── load history ────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async (page: number) => {
    setHistLoading(true);
    try {
      const res = await withdrawalService.listHistory(page);
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

  // ── computed effective amount ────────────────────────────────────────────────
  const effectiveAmount = selectedPreset !== null ? selectedPreset : parseFloat(customAmount) || 0;

  const maxAmount = balance ?? 0;
  const amountValid = effectiveAmount >= 1 && effectiveAmount <= Math.min(maxAmount, 50000);

  // ── submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!amountValid) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await withdrawalService.submitRequest(effectiveAmount);
    if (res.success) {
      setSelectedPreset(null);
      setCustomAmount('');
      await loadPending();
      await loadBalance();
    } else {
      const msgs: Record<string, string> = {
        pending_request_exists: 'You already have a pending withdrawal request.',
        amount_exceeds_balance: 'Amount exceeds your current wallet balance.',
        invalid_amount: 'Amount must be between ₱1 and ₱50,000.',
      };
      setSubmitError(msgs[res.error?.code ?? ''] ?? 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  // ── cancel ───────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!pending) return;
    setCancelling(true);
    const res = await withdrawalService.cancelRequest(pending.id);
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

        {/* ── Balance card ── */}
        <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              Current Balance
            </span>
            {balanceLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400 mt-1" />
            ) : (
              <span className="text-2xl font-bold text-white flex items-center gap-1">
                <PhilippinePeso className="w-5 h-5 text-neutral-400" />
                {(balance ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5 text-red-400" />
          </div>
        </div>

        {/* ── Request form (hidden while pending exists) ── */}
        {!pending && (
          <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold">Request Withdrawal</h2>
            <p className="text-sm text-neutral-400">
              Select a preset or enter a custom amount. Maximum is your current balance (up to
              ₱50,000).
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
                max={Math.min(maxAmount, 50000)}
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
              disabled={!amountValid || submitting || balanceLoading}
              className="w-full rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 disabled:opacity-40"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </span>
              ) : (
                `Request ${effectiveAmount >= 1 ? peso(effectiveAmount) : ''} Withdrawal`
              )}
            </Button>
          </div>
        )}

        {/* ── Pending request card ── */}
        {pendingLoading ? (
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
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
