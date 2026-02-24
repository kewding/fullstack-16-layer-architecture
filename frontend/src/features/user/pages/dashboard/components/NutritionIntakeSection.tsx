import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';

interface NutrientProgressProps {
  title: string;
  currentValue: number;
  limit: number; // required since every nutrient has a unique cap
  unit: string; // e.g., "g", "mg", "kcal"
}

export function UserProgressBar({ title, currentValue, limit, unit }: NutrientProgressProps) {
  const percentage = (currentValue / limit) * 100;
  const displayPercentage = Math.min(percentage, 100);

  return (
    <Card className="flex flex-row items-center w-full">
      <CardHeader className='flex flex-col w-2/5 items-center justify-center p-3'>
        <span className="text-xs font-medium leading-none">
          {currentValue}
          {unit} /
          
        </span>
        <span className="text-muted-foreground/60 text-[9px]">
            {limit}
            {unit}
          </span>
      </CardHeader>
      <CardContent className="flex flex-row w-full items-center pb-3">
        <Field className="w-full max-w-sm gap-0">
          <FieldLabel
            htmlFor={`intake-${title.toLowerCase()}`}
            className="flex justify-between items-end w-full mb-1"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {title}
            </span>
            <span
              className={`text-xs font-bold ${percentage > 100 ? 'text-destructive' : 'text-primary'}`}
            >
              {Math.round(percentage)}%
            </span>
          </FieldLabel>

          <Progress
            value={displayPercentage}
            id={`intake-${title.toLowerCase()}`}
            className="h-2"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
