import { Field, FieldLabel } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';

interface NutrientProgressProps {
  title: string;
  currentValue: number;
  limit: number; // required since every nutrient has a unique cap
  unit: string; // "g", "mg", "kcal"
}

export function UserProgressBar({ title, currentValue, limit, unit }: NutrientProgressProps) {
  const percentage = (currentValue / limit) * 100;
  const displayPercentage = Math.min(percentage, 100);

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel
        htmlFor={`intake-${title.toLowerCase()}`}
        className="flex justify-between items-end w-full mb-1"
      >
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </span>
          <span className="text-sm font-medium leading-none">
            {currentValue}
            {unit}{' '}
            <span className="text-muted-foreground/60 text-xs">
              / {limit}
              {unit}
            </span>
          </span>
        </div>
        <span
          className={`text-xs font-bold ${percentage > 100 ? 'text-destructive' : 'text-primary'}`}
        >
          {Math.round(percentage)}%
        </span>
      </FieldLabel>

      <Progress value={displayPercentage} id={`intake-${title.toLowerCase()}`} className="h-2" />
    </Field>
  );
}
