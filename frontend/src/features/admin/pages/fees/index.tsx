import React, { useEffect, useState } from 'react';
import { FeeCard } from './components/FeesCard';
import {
  feesService,
  type FeeComponentState,
  type FeeType,
  type GetFeesResponse,
} from './services/fees.services';

const FEE_TYPES: FeeType[] = [
  'utility_charges',
  'maintenance_rent',
  'insurance_administrative',
  'performance_security',
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export const AdminFeesPage: React.FC = () => {
  const [fees, setFees] = useState<GetFeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await feesService.getFees();
        setFees(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load fees');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Called by FeeCard after a successful save to optimistically update state.
  const handleFeeSuccess = (feeType: FeeType, newState: FeeComponentState) => {
    setFees((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [feeType]: newState,
        // Recalculate total_next_month
        total_next_month: FEE_TYPES.reduce((sum, ft) => {
          const s = ft === feeType ? newState : prev[ft];
          return sum + (s.next_month_amount ?? s.current_month_amount);
        }, 0),
      };
    });
  };

  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#415B5A]">Concession Fees</h1>
          <p className="text-sm text-[#415B5A]/50">
            Set the monthly fee components applied to all active vendors. Changes take effect on the
            1st of next month. If unchanged, current fees carry forward automatically.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[#415B5A]/50 text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-[#3F6F64] border-t-transparent animate-spin" />
            Loading fee settings…
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
            {error}
          </div>
        ) : fees ? (
          <>
            {/* Summary banner */}
            <div className="rounded-lg border border-[#3F6F64]/20 bg-[#E9F4F1] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#415B5A]/50">
                  Total — This Month
                </span>
                <span className="text-2xl font-bold text-[#3F6F64] font-mono">
                  {formatCurrency(fees.total_current_month)}
                </span>
                <span className="text-xs text-[#415B5A]/50">per vendor / month</span>
              </div>

              <div className="h-px sm:h-10 sm:w-px bg-[#3F6F64]/20" />

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#415B5A]/50">
                  Total — Next Month
                </span>
                <span className="text-2xl font-bold text-[#415B5A] font-mono">
                  {formatCurrency(fees.total_next_month)}
                </span>
                <span className="text-xs text-[#415B5A]/50">projected</span>
              </div>
            </div>

            {/* Fee cards grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {FEE_TYPES.map((ft) => (
                <FeeCard key={ft} feeType={ft} state={fees[ft]} onSuccess={handleFeeSuccess} />
              ))}
            </div>

            {/* Info note */}
            <p className="text-xs text-[#415B5A]/40 text-center pb-2">
              Fees are locked once set for the next month. You will receive a reminder on the 15th
              of each month to review upcoming fees. Unset fees carry forward automatically on the
              1st.
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
};
