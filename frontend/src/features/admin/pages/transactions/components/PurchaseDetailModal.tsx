import { transactionService } from '../services/transaction.service';
import type { PurchaseDetail } from '../schemas/transactions.schema';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PurchaseDetailModalProps {
  saleID: string;
  onClose: () => void;
}

export function PurchaseDetailModal({ saleID, onClose }: PurchaseDetailModalProps) {
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    transactionService.getPurchaseDetail(saleID)
      .then(setDetail)
      .catch(() => setError('Failed to load purchase details'))
      .finally(() => setLoading(false));
  }, [saleID]);

  const formatPeso = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800 sticky top-0 bg-neutral-900">
          <div>
            <h2 className="text-lg font-semibold">Purchase Details</h2>
            {detail && <p className="text-sm text-muted-foreground">{detail.stall_name}</p>}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Loading...
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-muted-foreground text-xs uppercase">
                    <th className="text-left pb-2">Product</th>
                    <th className="text-center pb-2">Qty</th>
                    <th className="text-right pb-2">Price</th>
                    <th className="text-right pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item, i) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      <td className="py-2">{item.product_name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatPeso(item.price)}</td>
                      <td className="py-2 text-right">{formatPeso(item.extended)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center pt-2 font-semibold">
                <span>Total</span>
                <span className="text-green-400">{formatPeso(detail.total)}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}