import type { TopupData } from '../../../services/topup.service';
import type { UserData } from '../../../services/user.service';

interface ReceiptModalProps {
  receipt: TopupData;
  user: UserData;
  onClose: () => void;
}

export function ReceiptModal({ receipt, user, onClose }: ReceiptModalProps) {
  const fullName = `${user.first_name} ${user.middle_name} ${user.last_name}`;
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(receipt.amount);
  const timestamp = new Date(receipt.timestamp).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5 shadow-xl">

        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">Top-Up Successful</h2>
          <p className="text-sm text-neutral-400">Transaction complete</p>
        </div>

        {/* Amount */}
        <div className="bg-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Amount Credited</p>
          <p className="text-3xl font-bold text-white">{formatted}</p>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <Row label="Customer" value={fullName} />
          <Row label="Transaction ID" value={receipt.transaction_id} mono />
          <Row label="Date & Time" value={timestamp} />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full mt-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-neutral-400 shrink-0">{label}</span>
      <span className={`text-sm text-white text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}