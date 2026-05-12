
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TransactionCard } from './TransactionCard';
import type { TransactionRow } from '../services/transactionhistory.service';
import { useState } from 'react';

interface TransactionGroupProps {
  label: string;
  transactions: TransactionRow[];
}

export function TransactionGroup({ label, transactions }: TransactionGroupProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      {/* Section header — matches mockup chevron + label style */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors group"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
        {label}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          ({transactions.length})
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3">
          {transactions.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}