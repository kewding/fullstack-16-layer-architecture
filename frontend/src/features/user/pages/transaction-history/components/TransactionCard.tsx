import { ArrowUpFromLine, ShoppingBag, Wallet } from 'lucide-react';
import type { TransactionRow } from '../services/transactionhistory.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const [whole, cents] = abs.toFixed(2).split('.');
  // Format whole part with commas
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatted}.${cents}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-PH', {
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

function TransactionIcon({ type }: { type: string }) {
  const base = 'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0';

  if (type === 'top-up') {
    return (
      <div className={`${base} bg-[hsl(var(--muted))]`}>
        <Wallet className="w-5 h-5 text-foreground" />
      </div>
    );
  }
  if (type === 'purchase') {
    return (
      <div className={`${base} bg-[hsl(var(--muted))]`}>
        <ShoppingBag className="w-5 h-5 text-foreground" />
      </div>
    );
  }
  return (
    <div className={`${base} bg-[hsl(var(--muted))]`}>
      <ArrowUpFromLine className="w-5 h-5 text-foreground" />
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (!status || status === 'completed') {
    return (
      <span className="text-sm font-medium text-green-600 dark:text-green-400">Completed</span>
    );
  }
  if (status === 'refunded') {
    return <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Refunded</span>;
  }
  if (status === 'blocked') {
    return <span className="text-sm font-medium text-red-500">Blocked</span>;
  }
  return <span className="text-sm font-medium text-muted-foreground capitalize">{status}</span>;
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface TransactionCardProps {
  transaction: TransactionRow;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const { reference_type, label, amount, new_balance, status, created_at, id } = transaction;
  const isCredit = amount > 0;
  const sign = isCredit ? '+' : '−'; // use minus sign (U+2212), not hyphen

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-card p-5 flex flex-col gap-3 shadow-sm">
      {/* Top row: icon + label + datetime + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TransactionIcon type={reference_type} />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(created_at)}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Amount row */}
      <div className="flex items-baseline gap-1">
        <span
          className={`text-3xl font-bold tracking-tight ${
            isCredit ? 'text-foreground' : 'text-foreground'
          }`}
        >
          {sign}&nbsp;
          <span className="text-muted-foreground text-2xl font-semibold mr-0.5">₱</span>
          {formatAmount(amount)}
        </span>
      </div>

      {/* Footer: new balance + reference id */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          New Balance:{' '}
          <span className="font-medium text-foreground">₱ {formatBalance(new_balance)}</span>
        </span>
        <span>Ref: #{id.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>
  );
}
