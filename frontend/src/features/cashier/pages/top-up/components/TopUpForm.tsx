import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { topupSchema, type TopupFormValues, type TopupInput } from '../schemas/topup.schema';

export function TopUpForm({ onSubmit }: { onSubmit: (data: TopupInput) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TopupFormValues, any, TopupInput>({
    resolver: zodResolver(topupSchema),
    mode: 'onTouched',
    defaultValues: {
      rfid: '',
      creditAmount: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldSet className="w-full max-w-sm p-2">
        <FieldLegend>User Credentials</FieldLegend>
        <FieldDescription>Ask user for rfid tag.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rfid">Customer RFID</FieldLabel>
            <Input
              id="rfid"
              type="text"
              {...register('rfid')}
              className={`h-12 bg-neutral-900 border rounded p-3 focus:outline-none ${
                errors.rfid ? 'border-red-500' : 'border-neutral-500 focus:border-white'
              }`}
              placeholder="860-960"
            />
            {errors.rfid && <p className="text-red-500 text-sm mt-1">{errors.rfid.message}</p>}
          </Field>
          <Field>
            <FieldLabel htmlFor="creditAmount">Amount</FieldLabel>
            <Input
              id="creditAmount"
              type="text"
              {...register('creditAmount')}
              className={`h-12 bg-neutral-900 border rounded p-3 focus:outline-none ${
                errors.creditAmount ? 'border-red-500' : 'border-neutral-500 focus:border-white'
              }`}
              placeholder="00.00"
            />
            {errors.creditAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.creditAmount.message}</p>
            )}
          </Field>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Validating...' : 'Submit'}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
