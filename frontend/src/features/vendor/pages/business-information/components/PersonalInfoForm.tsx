import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { vendorInfoService } from '@/features/vendor/services/vendor-info.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { personalInfoSchema, type PersonalInfoInput } from '../schemas/personal-info.schema';

export function PersonalInfoForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      birth_date: '',
      contact_number: '',
      stall_name: '',
    },
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await vendorInfoService.getPersonalInfo();
        form.reset({
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          birth_date: data.birth_date,
          contact_number: data.contact_number,
          stall_name: data.stall_name,
        });
      } catch (err) {
        setError('Failed to load personal information');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const onSubmit = async (data: PersonalInfoInput) => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await vendorInfoService.updatePersonalInfo(data);
      setSuccess(true);
    } catch (err) {
      setError('Failed to save personal information');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
        Loading...
      </div>
    );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">Personal Information</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">Saved successfully.</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" {...form.register('first_name')} />
          {form.formState.errors.first_name && (
            <span className="text-red-500 text-xs">{form.formState.errors.first_name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="middle_name">Middle Name</Label>
          <Input id="middle_name" {...form.register('middle_name')} />
          {form.formState.errors.middle_name && (
            <span className="text-red-500 text-xs">
              {form.formState.errors.middle_name.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" {...form.register('last_name')} />
          {form.formState.errors.last_name && (
            <span className="text-red-500 text-xs">{form.formState.errors.last_name.message}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="birth_date">Birth Date</Label>
          <Input id="birth_date" type="date" {...form.register('birth_date')} />
          {form.formState.errors.birth_date && (
            <span className="text-red-500 text-xs">{form.formState.errors.birth_date.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact_number">Contact Number</Label>
          <Input
            id="contact_number"
            placeholder="09123456789"
            {...form.register('contact_number')}
          />
          {form.formState.errors.contact_number && (
            <span className="text-red-500 text-xs">
              {form.formState.errors.contact_number.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stall_name">Stall / Business Name</Label>
          <Input id="stall_name" {...form.register('stall_name')} />
          {form.formState.errors.stall_name && (
            <span className="text-red-500 text-xs">{form.formState.errors.stall_name.message}</span>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Personal Info'}
        </Button>
      </div>
    </form>
  );
}
