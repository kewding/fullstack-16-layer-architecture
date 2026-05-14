// src/features/vendor/pages/transactions/components/VendorTxDetailModal.tsx

import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { vendorTransactionsService, type SaleDetail, type VendorTxRow } from '../services/transaction.service';

function peso(val: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(val);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-neutral-400 shrink-0">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}

interface Props {
  transaction: VendorTxRow;
  onClose: () => void;
}

export function VendorTxDetailModal({ transaction, onClose }: Props) {
  const isPurchase = transaction.entry_type === 'purchase';
  const isFee = transaction.entry_type === 'fee';
  const isRemittance = transaction.entry_type === 'remittance';

  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Fetch per-sale item breakdown when the row is a purchase entry
  // and has a reference_id (the sale UUID)
  useEffect(() => {
    if (!isPurchase || !transaction.reference_id) return;
    setLoadingDetail(true);
    vendorTransactionsService
      .getSaleDetail(transaction.reference_id)
      .then(setSaleDetail)
      .catch(() => setDetailError('Could not load sale items.'))
      .finally(() => setLoadingDetail(false));
  }, [isPurchase, transaction.reference_id]);

  const isCredit = transaction.signed_amount > 0;
  const amountColor = isCredit ? 'text-emerald-400' : 'text-red-400';
  const sign = isCredit ? '+' : '−';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{transaction.label}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount hero */}
        <div className="bg-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">
            {isCredit ? 'Revenue' : 'Debit'}
          </p>
          <p className={`text-3xl font-bold ${amountColor}`}>
            {sign}
            {peso(Math.abs(transaction.signed_amount))}
          </p>
        </div>

        {/* Common details */}
        <div className="flex flex-col gap-3">
          <DetailRow
            label="Date"
            value={new Date(transaction.created_at).toLocaleString('en-PH', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          />
          <DetailRow
            label="New Balance"
            value={peso(transaction.new_balance)}
          />
          <DetailRow
            label="Reference"
            value={`#${transaction.reference_number.slice(0, 8).toUpperCase()}`}
          />
          {isFee && transaction.billing_month && (
            <DetailRow label="Billing Month" value={transaction.billing_month} />
          )}
          {isRemittance && (
            <DetailRow label="Type" value="Withdrawal / Remittance" />
          )}
        </div>

        {/* Per-sale item breakdown (purchase entries only) */}
        {isPurchase && (
          <div className="flex flex-col gap-3">
            <div className="h-px bg-neutral-700" />
            <h3 className="text-sm font-semibold text-neutral-200">
              Sale Items
            </h3>

            {loadingDetail ? (
              <div className="flex items-center gap-2 text-neutral-500 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading items…
              </div>
            ) : detailError ? (
              <p className="text-sm text-red-400">{detailError}</p>
            ) : saleDetail ? (
              <>
                {/* Stall name */}
                <p className="text-xs text-neutral-400">
                  Stall:{' '}
                  <span className="text-white font-medium">
                    {saleDetail.stall_name}
                  </span>
                </p>

                {/* Items table */}
                <div className="rounded-lg border border-neutral-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-800 text-neutral-400 text-xs uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleDetail.items.map((item, i) => (
                        <tr
                          key={i}
                          className="border-t border-neutral-700 text-neutral-300"
                        >
                          <td className="px-3 py-2">{item.product_name}</td>
                          <td className="px-3 py-2 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {peso(item.price)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-white">
                            {peso(item.extended)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-600 bg-neutral-800">
                        <td
                          colSpan={3}
                          className="px-3 py-2 text-right text-xs text-neutral-400 uppercase tracking-wide"
                        >
                          Total
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-400">
                          {peso(saleDetail.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500">No items found.</p>
            )}
          </div>
        )}

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