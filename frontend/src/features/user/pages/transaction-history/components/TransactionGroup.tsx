import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { TransactionRow } from '../services/transactionhistory.service';
import { TransactionCard } from './TransactionCard';

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
        className="flex items-center gap-2 text-sm font-semibold text-white hover:text-[#CD9A34] transition-colors group"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-white text-muted-foreground group-hover:text-[#CD9A34] transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-white text-muted-foreground group-hover:text-[#CD9A34] transition-colors" />
        )}
        {label}
        <span className="ml-1 text-xs font-normal text-white text-muted-foreground">
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
