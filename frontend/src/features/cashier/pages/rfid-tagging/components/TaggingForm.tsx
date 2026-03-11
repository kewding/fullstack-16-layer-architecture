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
import { taggingSchema, type TaggingInput } from '../schemas/tagging.schema';

export function TaggingForm({ onSubmit }: { onSubmit: (data: TaggingInput) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaggingInput>({
    resolver: zodResolver(taggingSchema),
    mode: 'onTouched',
    defaultValues: {
      uuid: '',
      rfid: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldSet className="w-full max-w-sm p-2">
        <FieldLegend>User Information</FieldLegend>
        <FieldDescription>Ask user for UUID.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="uuid">Customer UUID</FieldLabel>
            {/* 3. Add 'name' attributes so FormData can pick up the values */}
            <Input
              id="uuid"
              type="text"
              {...register('uuid')}
              className={`h-12 bg-neutral-900 border rounded p-3 focus:outline-none ${
                errors.uuid ? 'border-red-500' : 'border-neutral-500 focus:border-white'
              }`}
              placeholder="f47ac10b..."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="rfid">RFID Tag</FieldLabel>
            <Input
              id="rfid"
              type="text"
              {...register('rfid')}
              className={`h-12 bg-neutral-900 border rounded p-3 focus:outline-none ${
                errors.rfid ? 'border-red-500' : 'border-neutral-500 focus:border-white'
              }`}
              placeholder="860-960"
            />
          </Field>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Validating...' : 'Submit'}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
