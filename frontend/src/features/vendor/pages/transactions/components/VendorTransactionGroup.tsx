// src/features/vendor/pages/transactions/components/VendorTransactionGroup.tsx

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { VendorTxRow } from '../services/transaction.service';
import { VendorTransactionCard } from './VendorTransactionsCard';

interface Props {
  label: string;
  transactions: VendorTxRow[];
  onCardClick: (tx: VendorTxRow) => void;
}

export function VendorTransactionGroup({ label, transactions, onCardClick }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-white hover:text-[#CD9A34] transition-colors group"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-white group-hover:text-[#CD9A34] transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-white group-hover:text-[#CD9A34] transition-colors" />
        )}
        {label}
        <span className="ml-1 text-xs font-normal text-neutral-400">
          ({transactions.length})
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3">
          {transactions.map((tx) => (
            <VendorTransactionCard
              key={tx.id}
              transaction={tx}
              onClick={() => onCardClick(tx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}