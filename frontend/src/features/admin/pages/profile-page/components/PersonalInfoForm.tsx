import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { personalInfoSchema, type PersonalInfoInput } from '../schemas/personal-info.schema';
import { adminInfoService } from '../services/personal-info.service';

// ── Shared style tokens ───────────────────────────────────────────────────────
const INPUT_BASE =
  'h-12 w-full bg-transparent text-[#3F6F64] border border-[#3F6F64] rounded px-3 ' +
  'focus:outline-none focus:border-[#CD9A34] transition-colors ' +
  'placeholder:text-[#3F6F64]/40 disabled:opacity-50 disabled:cursor-not-allowed';

const INPUT_ERROR = 'border-red-400 focus:border-red-400';

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-[#415B5A] font-normal">
        {label}
      </label>
      {children}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PersonalInfoFormProps {
  onSaveSuccess?: (data: PersonalInfoInput) => void;
}

export function PersonalInfoForm({ onSaveSuccess }: PersonalInfoFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      birth_date: '',
      contact_number: '',
    },
  });

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await adminInfoService.getPersonalInfo();
        reset({
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          birth_date: data.birth_date,
          contact_number: data.contact_number,
        });
      } catch {
        setFetchError('Failed to load personal information. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: PersonalInfoInput) => {
    setSaving(true);
    setSaveError(null);
    setSuccess(false);
    try {
      await adminInfoService.updatePersonalInfo(data);
      setSuccess(true);
      onSaveSuccess?.(data);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save personal information.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#415B5A]/50 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-[#3F6F64] border-t-transparent animate-spin" />
        Loading…
      </div>
    );
  }

  if (fetchError) {
    return <p className="text-red-500 text-sm">{fetchError}</p>;
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#415B5A]/50">
        Personal Information
      </p>

      {/* Feedback banners */}
      {saveError && (
        <div className="bg-red-500/10 border border-red-400 text-red-500 rounded px-4 py-3 text-sm">
          {saveError}
        </div>
      )}
      {success && (
        <div className="bg-[#3F6F64]/10 border border-[#3F6F64] text-[#3F6F64] rounded px-4 py-3 text-sm">
          Saved successfully.
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Field label="First Name" htmlFor="first_name" error={errors.first_name?.message}>
          <input
            id="first_name"
            {...register('first_name')}
            className={`${INPUT_BASE} ${errors.first_name ? INPUT_ERROR : ''}`}
          />
        </Field>

        <Field label="Middle Name" htmlFor="middle_name" error={errors.middle_name?.message}>
          <input
            id="middle_name"
            {...register('middle_name')}
            className={`${INPUT_BASE} ${errors.middle_name ? INPUT_ERROR : ''}`}
          />
        </Field>

        <Field label="Last Name" htmlFor="last_name" error={errors.last_name?.message}>
          <input
            id="last_name"
            {...register('last_name')}
            className={`${INPUT_BASE} ${errors.last_name ? INPUT_ERROR : ''}`}
          />
        </Field>
      </div>

      {/* Birth date + Contact */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Field label="Birth Date" htmlFor="birth_date" error={errors.birth_date?.message}>
          <input
            id="birth_date"
            type="date"
            {...register('birth_date')}
            className={`${INPUT_BASE} ${errors.birth_date ? INPUT_ERROR : ''}`}
          />
        </Field>

        <Field
          label="Contact Number"
          htmlFor="contact_number"
          error={errors.contact_number?.message}
        >
          <input
            id="contact_number"
            placeholder="09123456789"
            {...register('contact_number')}
            className={`${INPUT_BASE} ${errors.contact_number ? INPUT_ERROR : ''}`}
          />
        </Field>
      </div>

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
          {saving ? 'Saving…' : 'Save Personal Info'}
        </button>
      </div>
    </form>
  );
}
