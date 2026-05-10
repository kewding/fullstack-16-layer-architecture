import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { userProfileSchema, type UserProfileInput } from '../schemas/profile.schema';
import { userProfileService } from '../services/profile.service';
import { RoleSelector } from './RoleSelector';

// ── Shared style tokens ───────────────────────────────────────────────────────
const INPUT_BASE =
  'h-12 w-full bg-transparent text-[#3F6F64] border border-[#3F6F64] rounded px-3 ' +
  'focus:outline-none focus:border-[#CD9A34] transition-colors ' +
  'placeholder:text-[#3F6F64]/40 disabled:opacity-50 disabled:cursor-not-allowed';

const INPUT_ERROR = 'border-red-400 focus:border-red-400';

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-[#415B5A] font-normal">{label}</label>
      {children}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PersonalInfoFormProps {
  /** Callback so the master page can refresh the banner after a successful save */
  onSaveSuccess?: (data: UserProfileInput) => void;
}

export function PersonalInfoForm({ onSaveSuccess }: PersonalInfoFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      birth_date: '',
      contact_number: '',
      customer_role: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await userProfileService.getProfile();
        reset({
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          birth_date: data.birth_date,
          contact_number: data.contact_number,
          customer_role:
            data.customer_role === 'student' ||
            data.customer_role === 'teacher' ||
            data.customer_role === 'faculty'
              ? data.customer_role
              : undefined,
        });
      } catch {
        setFetchError('Failed to load personal information. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: UserProfileInput) => {
    setSaving(true);
    setSaveError(null);
    setSuccess(false);
    try {
      await userProfileService.updateProfile(data);
      setSuccess(true);
      onSaveSuccess?.(data);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#415B5A]/50 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-[#3F6F64] border-t-transparent animate-spin" />
        Loading…
      </div>
    );
  }

  // ── Fetch error ─────────────────────────────────────────────────────────────
  if (fetchError) {
    return <p className="text-red-500 text-sm">{fetchError}</p>;
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Section label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-[#415B5A]/50">
        Personal Information
      </p>

      {/* Save feedback */}
      {saveError && (
        <div className="bg-red-500/10 border border-red-400 text-red-500 rounded px-4 py-3 text-sm text-center">
          {saveError}
        </div>
      )}
      {success && (
        <div className="bg-[#3F6F64]/10 border border-[#3F6F64] text-[#3F6F64] rounded px-4 py-3 text-sm text-center">
          Profile saved successfully.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="First Name" error={errors.first_name?.message}>
            <input
              {...register('first_name')}
              placeholder="Juan"
              className={`${INPUT_BASE} ${errors.first_name ? INPUT_ERROR : ''}`}
            />
          </Field>

          <Field label="Middle Name" error={errors.middle_name?.message}>
            <input
              {...register('middle_name')}
              placeholder="Santos"
              className={`${INPUT_BASE} ${errors.middle_name ? INPUT_ERROR : ''}`}
            />
          </Field>

          <Field label="Last Name" error={errors.last_name?.message}>
            <input
              {...register('last_name')}
              placeholder="Dela Cruz"
              className={`${INPUT_BASE} ${errors.last_name ? INPUT_ERROR : ''}`}
            />
          </Field>
        </div>

        {/* Birth date + Contact */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Birth Date" error={errors.birth_date?.message}>
            <input
              type="date"
              {...register('birth_date')}
              className={`${INPUT_BASE} ${errors.birth_date ? INPUT_ERROR : ''}`}
            />
          </Field>

          <Field label="Contact Number" error={errors.contact_number?.message}>
            <input
              {...register('contact_number')}
              placeholder="09123456789"
              className={`${INPUT_BASE} ${errors.contact_number ? INPUT_ERROR : ''}`}
            />
          </Field>
        </div>

        {/* Role selector */}
        <RoleSelector setValue={setValue} watch={watch} error={errors.customer_role?.message} />

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className={`
              rounded-full px-8 h-12 font-bold text-white transition-opacity
              ${
                saving
                  ? 'bg-[#3F6F64] opacity-50 cursor-not-allowed'
                  : 'bg-[#3F6F64] hover:bg-[#27463f]'
              }
            `}
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
