import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { feeSchema, type FeeInput } from '../schemas/fees.schema';
import {
  FEE_DESCRIPTIONS,
  FEE_LABELS,
  feesService,
  type FeeComponentState,
  type FeeType,
} from '../services/fees.services';
import { FeeStatusBadge } from './FeesStatusBadge';
const INPUT_BASE =
  'h-11 w-full bg-transparent text-[#3F6F64] border border-[#3F6F64] rounded px-3 ' +
  'focus:outline-none focus:border-[#CD9A34] transition-colors ' +
  'placeholder:text-[#3F6F64]/40 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'text-sm font-mono';

const INPUT_ERROR = 'border-red-400 focus:border-red-400';

interface FeeCardProps {
  feeType: FeeType;
  state: FeeComponentState;
  onSuccess: (feeType: FeeType, newState: FeeComponentState) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatMonth(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function FeeCard({ feeType, state, onSuccess }: FeeCardProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeeInput>({
    resolver: zodResolver(feeSchema),
    defaultValues: { amount: '' },
  });

  const onSubmit = async (data: FeeInput) => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const amount = parseFloat(data.amount);
      await feesService.setFee(feeType, amount);

      setSaveSuccess(true);
      reset({ amount: '' });

      // Optimistically update the parent state so the card flips to locked.
      onSuccess(feeType, {
        ...state,
        next_month_amount: amount,
        locked: true,
      });

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update fee';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#3F6F64]/20 bg-white p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#415B5A]">{FEE_LABELS[feeType]}</p>
          <p className="text-xs text-[#415B5A]/50 mt-0.5">{FEE_DESCRIPTIONS[feeType]}</p>
        </div>
        <FeeStatusBadge locked={state.locked} lockedUntil={state.locked_until} />
      </div>

      {/* Current month value */}
      <div className="flex flex-col gap-1 rounded-md bg-[#E9F4F1] px-3 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#415B5A]/50">
          {formatMonth(state.effective_month)} (current)
        </span>
        <span className="text-lg font-bold text-[#3F6F64] font-mono">
          {formatCurrency(state.current_month_amount)}
        </span>
      </div>

      {/* Next month value — shown when locked */}
      {state.locked && state.next_month_amount !== null && (
        <div className="flex flex-col gap-1 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/70">
            Next month (pending)
          </span>
          <span className="text-lg font-bold text-amber-700 font-mono">
            {formatCurrency(state.next_month_amount)}
          </span>
        </div>
      )}

      {/* Input + submit — shown when unlocked */}
      {!state.locked && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          {saveError && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p className="text-[#3F6F64] text-xs bg-[#3F6F64]/10 border border-[#3F6F64]/20 rounded px-3 py-2">
              Fee set for next month successfully.
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#415B5A]/70 font-medium">
              Set amount for next month (₱)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('amount')}
              disabled={saving}
              className={`${INPUT_BASE} ${errors.amount ? INPUT_ERROR : ''}`}
            />
            {errors.amount && <span className="text-red-500 text-xs">{errors.amount.message}</span>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`
              h-10 rounded-full px-6 text-sm font-bold text-white transition-all self-end
              ${
                saving
                  ? 'bg-[#3F6F64]/50 cursor-not-allowed'
                  : 'bg-[#3F6F64] hover:bg-[#27463f] active:scale-95'
              }
            `}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving…
              </span>
            ) : (
              'Set for Next Month'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
