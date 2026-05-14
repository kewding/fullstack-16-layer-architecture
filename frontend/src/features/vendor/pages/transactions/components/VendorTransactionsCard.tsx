// src/features/vendor/pages/transactions/components/VendorTransactionCard.tsx

import { ArrowDownLeft, ArrowUpRight, Coins } from 'lucide-react';
import type { VendorTxRow } from '../services/transaction.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const [whole, cents] = abs.toFixed(2).split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + cents;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatBalance(balance: number): string {
  return balance.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Icon ──────────────────────────────────────────────────────────────────────
function TxIcon({ type }: { type: string }) {
  const base =
    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0';

  if (type === 'purchase') {
    return (
      <div className={`${base} bg-emerald-500/10`}>
        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
      </div>
    );
  }
  if (type === 'remittance') {
    return (
      <div className={`${base} bg-red-500/10`}>
        <ArrowDownLeft className="w-5 h-5 text-red-400" />
      </div>
    );
  }
  // fee
  return (
    <div className={`${base} bg-orange-500/10`}>
      <Coins className="w-5 h-5 text-orange-400" />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
interface Props {
  transaction: VendorTxRow;
  onClick: () => void;
}

export function VendorTransactionCard({ transaction, onClick }: Props) {
  const { entry_type, label, signed_amount, new_balance, created_at, id } =
    transaction;

  const isCredit = signed_amount > 0;
  const sign = isCredit ? '+' : '−';
  const amountColor = isCredit ? 'text-emerald-400' : 'text-red-400';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-[hsl(var(--border))] bg-card p-5 flex flex-col gap-3 shadow-sm hover:bg-muted/40 transition-colors"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TxIcon type={entry_type} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {label}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(created_at)}
            </span>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            isCredit
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {isCredit ? 'Credit' : 'Debit'}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold tracking-tight ${amountColor}`}>
          {sign}&nbsp;
          <span className="text-muted-foreground text-2xl font-semibold mr-0.5">
            ₱
          </span>
          {formatAmount(Math.abs(signed_amount))}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          New Balance:{' '}
          <span className="font-medium text-foreground">
            ₱ {formatBalance(new_balance)}
          </span>
        </span>
        <span>Ref: #{id.slice(0, 8).toUpperCase()}</span>
      </div>
    </button>
  );
}