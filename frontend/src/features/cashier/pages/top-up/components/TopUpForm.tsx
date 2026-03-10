import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function TopUpForm() {
  return (
    <FieldSet className="w-full max-w-sm p-2">
      <FieldLegend>User Credentials</FieldLegend>
      <FieldDescription>Ask user for rfid tag.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="rfid">Customer RFID</FieldLabel>
          <Input id="rfid" type="text" placeholder="860-960" />
        </Field>
        <Field>
          <FieldLabel htmlFor="creditAmount">Amount</FieldLabel>
          <Input id="creditAmount" type="text" placeholder="00.00" />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
