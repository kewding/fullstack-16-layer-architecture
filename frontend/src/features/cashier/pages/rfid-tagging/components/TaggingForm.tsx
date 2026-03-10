import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function TaggingForm() {
  return (
    <FieldSet className="w-full max-w-sm p-2">
      <FieldLegend>User Information</FieldLegend>
      <FieldDescription>Ask user for UUID.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="uuid">Customer UUID</FieldLabel>
          <Input id="uuid" type="text" placeholder="f47ac10b-58cc-4372-a567-0e02b2c3d479" />
        </Field>
        <Field>
          <FieldLabel htmlFor="rfid">RFID Tag</FieldLabel>
          <Input id="rfid" type="text" placeholder="860-960" />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
