// VendorWithdrawalPage.tsx
import {
  AlertCircle,
  ArrowDownLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PendingWithdrawalResponse, WithdrawalHistoryRow } from './schemas/remittance.schema';
import { vendorWithdrawalService } from './services/remittance.service';

// ── helpers ───────────────────────────────────────────────────────────────────

const formatPeso = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle className="w-3.5 h-3.5" />,
    classes: 'bg-red-500/15 text-red-400 border border-red-500/30',
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
};

// ── Popover tooltip beside the input ──────────────────────────────────────────

interface WalletPopoverProps {
  balance: number;
  show: boolean;
}

function WalletPopover({ balance, show }: WalletPopoverProps) {
  if (!show) return null;
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-20 w-56 rounded-xl bg-[#1a2740] border border-[#2a3f60] shadow-2xl p-3 text-sm">
      <div className="flex items-center gap-2 text-[#8da5c8] mb-1">
        <Info className="w-3.5 h-3.5 text-[#CD9A34]" />
        <span className="font-medium text-xs uppercase tracking-wide">Available Balance</span>
      </div>
      <p className="text-white font-semibold text-base">{formatPeso(balance)}</p>
      <p className="text-[#6b8099] text-xs mt-1">You can withdraw up to this amount.</p>
      {/* arrow */}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[#2a3f60]" />
    </div>
  );
}

// ── History detail modal ──────────────────────────────────────────────────────

interface HistoryDetailModalProps {
  row: WithdrawalHistoryRow;
  onClose: () => void;
}

function HistoryDetailModal({ row, onClose }: HistoryDetailModalProps) {
  const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111c2d] border border-[#1e2e45] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2e45]">
          <h2 className="text-base font-semibold text-white">Withdrawal Detail</h2>
          <button onClick={onClose} className="text-[#4a6080] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Amount */}
          <div className="rounded-xl bg-[#0d1828] border border-[#1e2e45] p-4 text-center">
            <p className="text-[#8da5c8] text-xs mb-1">Amount</p>
            <p className="text-3xl font-bold text-white">{formatPeso(row.amount)}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCell label="Status">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}
              >
                {cfg.icon} {cfg.label}
              </span>
            </DetailCell>
            <DetailCell label="Date">{formatDate(row.created_at)}</DetailCell>
            <DetailCell label="Processed By">{row.cashier_name ?? '—'}</DetailCell>
            <DetailCell label="Balance Before">
              {row.balance_before != null ? formatPeso(row.balance_before) : '—'}
            </DetailCell>
            <DetailCell label="Balance After">
              {row.balance_after != null ? formatPeso(row.balance_after) : '—'}
            </DetailCell>
          </div>

          {/* Rejection info */}
          {row.status === 'rejected' && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex flex-col gap-1">
              <p className="text-red-400 text-xs font-semibold uppercase tracking-wide">
                Rejection Info
              </p>
              <p className="text-red-300 text-sm capitalize">
                {row.rejection_reason?.replace(/_/g, ' ') ?? '—'}
              </p>
              {row.rejection_comment && (
                <p className="text-[#8da5c8] text-sm mt-1 italic">"{row.rejection_comment}"</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[#0d1828] border border-[#1e2e45] p-3">
      <p className="text-[#4a6080] text-xs mb-1">{label}</p>
      <div className="text-white text-sm font-medium">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export const VendorWithdrawalPage: React.FC = () => {
  // Wallet + pending state
  const [balance, setBalance] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingWithdrawalResponse | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // Request form
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // History
  const [historyPage, setHistoryPage] = useState(1);
  const [historyData, setHistoryData] = useState<WithdrawalHistoryRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<WithdrawalHistoryRow | null>(null);

  // Cancelling
  const [cancelling, setCancelling] = useState(false);

  const loadInit = useCallback(async () => {
    try {
      const [bal, pend] = await Promise.all([
        vendorWithdrawalService.getWalletBalance(),
        vendorWithdrawalService.getPendingRequest(),
      ]);
      setBalance(bal);
      setPending(pend);
    } catch {
      // non-fatal
    } finally {
      setLoadingInit(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await vendorWithdrawalService.listHistory(historyPage, '', '');
      setHistoryData(res.data);
      setHistoryTotal(res.total);
      setHistoryTotalPages(res.total_pages);
    } catch {
      // non-fatal
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    loadInit();
  }, [loadInit]);
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const parsedAmount = parseFloat(amount);
  const amountValid =
    !isNaN(parsedAmount) && parsedAmount >= 1 && balance !== null && parsedAmount <= balance;

  const handleSubmit = async () => {
    if (!amountValid) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const pend = await vendorWithdrawalService.submitRequest(parsedAmount);
      setPending(pend);
      setAmount('');
      if (balance !== null) setBalance(balance); // balance hasn't changed yet
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!pending) return;
    setCancelling(true);
    try {
      await vendorWithdrawalService.cancelRequest(pending.id);
      setPending(null);
      loadHistory();
    } catch {
      // show nothing, request might already be processed
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="w-full px-1">
      <main className="flex flex-col gap-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Withdrawal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request a cash withdrawal from your wallet balance.
          </p>
        </div>

        {/* Wallet balance card */}
        <div className="rounded-2xl border bg-white p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Available Balance
            </p>
            <p className="text-3xl font-bold mt-1">
              {loadingInit ? '—' : formatPeso(balance ?? 0)}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#CD9A34]/10">
            <ArrowDownLeft className="w-6 h-6 text-[#CD9A34]" />
          </div>
        </div>

        {/* Request section */}
        <div className="rounded-2xl border bg-white p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold">Request Withdrawal</h2>

          {pending ? (
            /* Pending state card */
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Pending Request</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {formatPeso(pending.amount)} — submitted {formatDate(pending.created_at)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    You cannot submit another request while one is pending.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 underline underline-offset-2 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
          ) : (
            /* Amount input */
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-muted-foreground">Amount (₱)</label>
              <div className="relative flex items-center">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    ₱
                  </span>
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    max={balance ?? undefined}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setSubmitError('');
                    }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="0.00"
                    className="w-full h-12 pl-9 pr-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#CD9A34]/50 focus:border-[#CD9A34]"
                  />
                  {/* Popover beside the input */}
                  <WalletPopover balance={balance ?? 0} show={inputFocused && balance !== null} />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!amountValid || submitting}
                  className="ml-3 h-12 px-6 rounded-xl bg-[#CD9A34] text-white text-sm font-semibold
                    hover:bg-[#b8862c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Request
                </button>
              </div>

              {/* Validation hints */}
              {amount && !amountValid && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isNaN(parsedAmount) || parsedAmount < 1
                    ? 'Minimum withdrawal amount is ₱1'
                    : `Cannot exceed your available balance of ${formatPeso(balance ?? 0)}`}
                </div>
              )}

              {submitError && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* History table */}
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-sm font-semibold">Withdrawal History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cashier
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading…
                      </div>
                    </td>
                  </tr>
                ) : historyData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      No withdrawal history yet.
                    </td>
                  </tr>
                ) : (
                  historyData.map((row) => {
                    const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending;
                    return (
                      <tr key={row.id} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">{formatDate(row.created_at)}</td>
                        <td className="px-5 py-4 font-medium">{formatPeso(row.amount)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}
                          >
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {row.cashier_name ?? '—'}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="text-xs font-medium text-[#CD9A34] hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t">
            <p className="text-sm text-muted-foreground">{historyTotal} records total</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-lg border hover:bg-muted/40 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground px-1">
                Page {historyPage} of {Math.max(historyTotalPages, 1)}
              </span>
              <button
                onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                disabled={historyPage >= historyTotalPages}
                className="h-8 w-8 flex items-center justify-center rounded-lg border hover:bg-muted/40 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Detail modal */}
      {selectedRow && <HistoryDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
};
