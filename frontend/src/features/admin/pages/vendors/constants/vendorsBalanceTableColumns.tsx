import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { GraduateVendorModal } from '../components/GraduateVendorModal';
import { VendorDetailModal } from '../components/VendorDetailModal';
import { capitalizeWords } from '../helper/capitalize';
import { vendorService, type VendorBalanceRow } from '../services/vendor.service';

const formatPHP = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

// ── Action buttons cell ───────────────────────────────────────────────────────

function BalanceActionButtons({
  id,
  stallName,
  walletBalance,
  onGraduated,
}: {
  id: string;
  stallName: string;
  walletBalance: number;
  onGraduated: () => void;
}) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGraduateModal, setShowGraduateModal] = useState(false);

  // Refresh wallet balance when graduate modal opens to ensure freshness
  const [liveBalance, setLiveBalance] = useState<number>(walletBalance);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const handleOpenGraduate = async () => {
    setLoadingBalance(true);
    try {
      const fresh = await vendorService.getWalletBalance(id);
      setLiveBalance(fresh);
    } catch {
      // fall back to prop value
    } finally {
      setLoadingBalance(false);
      setShowGraduateModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowDetailModal(true)}>
          View
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-red-400/50 text-red-400 bg-red-100 hover:bg-red-500/10 hover:text-red-400"
          onClick={handleOpenGraduate}
          disabled={loadingBalance}
        >
          {loadingBalance ? '...' : 'Remove'}
        </Button>
      </div>

      {showDetailModal && (
        // VendorDetailModal in read-only mode for in_business vendors
        // (no approve/remove buttons shown — handled in VendorDetailModal itself)
        <VendorDetailModal
          vendorID={id}
          onClose={() => setShowDetailModal(false)}
          onApproved={() => setShowDetailModal(false)}
        />
      )}

      {showGraduateModal && (
        <GraduateVendorModal
          vendorID={id}
          stallName={stallName}
          walletBalance={liveBalance}
          onClose={() => setShowGraduateModal(false)}
          onGraduated={() => {
            onGraduated();
            setShowGraduateModal(false);
          }}
        />
      )}
    </>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

export const VENDORS_BALANCE_TABLE_COLUMNS = (
  onGraduated: () => void,
): ColumnDef<VendorBalanceRow>[] => [
  {
    accessorKey: 'stall_name',
    header: 'Stall Name',
    cell: ({ row }) =>
      capitalizeWords(row.original.stall_name ?? '') || (
        <span className="text-muted-foreground italic text-xs">—</span>
      ),
  },
  {
    accessorKey: 'vendor_profit',
    header: 'Profit',
    cell: ({ row }) => formatPHP(row.original.vendor_profit),
  },
  {
    accessorKey: 'concession_fee',
    header: 'Fee',
    cell: ({ row }) => {
      const { concession_fee_value, concession_fee } = row.original;
      if (!concession_fee_value) {
        return <span className="text-muted-foreground text-xs">Not set</span>;
      }
      return (
        <span className="flex flex-col">
          <span>{formatPHP(concession_fee)}</span>
          <span className="text-xs text-muted-foreground">
            ({formatPHP(concession_fee_value)} fixed)
          </span>
        </span>
      );
    },
  },
  {
    accessorKey: 'wallet_balance',
    header: 'Balance',
    cell: ({ row }) => (
      <span
        className={`font-semibold ${row.original.wallet_balance > 0 ? 'text-green-400' : 'text-muted-foreground'}`}
      >
        {formatPHP(row.original.wallet_balance)}
      </span>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <BalanceActionButtons
          id={row.original.id}
          stallName={row.original.stall_name ?? ''}
          walletBalance={row.original.wallet_balance}
          onGraduated={onGraduated}
        />
      </div>
    ),
  },
];
