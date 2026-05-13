// src/features/user/pages/dashboard/components/NutritionIntakeSection.tsx

import { Card } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import type { NutritionData } from '../services/dashboard.service';

// ── Progress bar sub-component ────────────────────────────────────────────────

interface NutrientProgressProps {
  title: string;
  currentValue: number;
  limit: number;
  unit: string;
}

export function UserProgressBar({ title, currentValue, limit, unit }: NutrientProgressProps) {
  const percentage = limit > 0 ? (currentValue / limit) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100);

  return (
    <Card className="flex flex-row items-center w-full">
      <div className="flex flex-col w-2/5 items-center justify-center p-3">
        <span className="text-xs font-medium leading-none">
          {Number.isInteger(currentValue) ? currentValue : currentValue.toFixed(1)}
          {unit} /
        </span>
        <span className="text-muted-foreground/60 text-[9px]">
          {Number.isInteger(limit) ? limit : limit.toFixed(1)}
          {unit}
        </span>
      </div>
      <div className="flex flex-row w-full items-center pb-3 pr-3 pt-3">
        <Field className="w-full max-w-sm gap-0">
          <FieldLabel
            htmlFor={`intake-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex justify-between items-end w-full mb-1"
          >
            <span className="text-xs tracking-wider text-muted-foreground font-semibold">
              {title}
            </span>
            <span
              className={`text-xs font-bold ${
                percentage > 100 ? 'text-destructive' : 'text-primary'
              }`}
            >
              {Math.round(percentage)}%
            </span>
          </FieldLabel>
          <Progress
            value={displayPercentage}
            id={`intake-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="h-2"
          />
        </Field>
      </div>
    </Card>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

interface NutritionIntakeSectionProps {
  data: NutritionData | null;
  loading: boolean;
}

interface NutrientEntry {
  id: string;
  title: string;
  currentValue: number;
  limit: number;
  unit: string;
}

function buildNutrients(data: NutritionData): NutrientEntry[] {
  return [
    {
      id: 'vitamin-a',
      title: 'Vitamin A',
      currentValue: data.totals.vitamin_a_mcg,
      limit: data.limits.vitamin_a_mcg,
      unit: 'mcg',
    },
    {
      id: 'vitamin-c',
      title: 'Vitamin C',
      currentValue: data.totals.vitamin_c_mg,
      limit: data.limits.vitamin_c_mg,
      unit: 'mg',
    },
    {
      id: 'vitamin-e',
      title: 'Vitamin E',
      currentValue: data.totals.vitamin_e_mg,
      limit: data.limits.vitamin_e_mg,
      unit: 'mg',
    },
    {
      id: 'fiber',
      title: 'Dietary Fiber',
      currentValue: data.totals.fiber_g,
      limit: data.limits.fiber_g,
      unit: 'g',
    },
    {
      id: 'protein',
      title: 'Protein',
      currentValue: data.totals.protein_g,
      limit: data.limits.protein_g,
      unit: 'g',
    },
    {
      id: 'calcium',
      title: 'Calcium',
      currentValue: data.totals.calcium_mg,
      limit: data.limits.calcium_mg,
      unit: 'mg',
    },
    {
      id: 'iron',
      title: 'Iron',
      currentValue: data.totals.iron_mg,
      limit: data.limits.iron_mg,
      unit: 'mg',
    },
    {
      id: 'potassium',
      title: 'Potassium',
      currentValue: data.totals.potassium_mg,
      limit: data.limits.potassium_mg,
      unit: 'mg',
    },
    {
      id: 'magnesium',
      title: 'Magnesium',
      currentValue: data.totals.magnesium_mg,
      limit: data.limits.magnesium_mg,
      unit: 'mg',
    },
  ];
}

const EMPTY_NUTRIENTS: NutrientEntry[] = [
  { id: 'vitamin-a', title: 'Vitamin A', currentValue: 0, limit: 1, unit: 'mcg' },
  { id: 'vitamin-c', title: 'Vitamin C', currentValue: 0, limit: 1, unit: 'mg' },
  { id: 'vitamin-e', title: 'Vitamin E', currentValue: 0, limit: 1, unit: 'mg' },
  { id: 'fiber', title: 'Dietary Fiber', currentValue: 0, limit: 1, unit: 'g' },
  { id: 'protein', title: 'Protein', currentValue: 0, limit: 1, unit: 'g' },
  { id: 'calcium', title: 'Calcium', currentValue: 0, limit: 1, unit: 'mg' },
  { id: 'iron', title: 'Iron', currentValue: 0, limit: 1, unit: 'mg' },
  { id: 'potassium', title: 'Potassium', currentValue: 0, limit: 1, unit: 'mg' },
  { id: 'magnesium', title: 'Magnesium', currentValue: 0, limit: 1, unit: 'mg' },
];

export function NutritionIntakeSection({ data, loading }: NutritionIntakeSectionProps) {
  const nutrients = data ? buildNutrients(data) : EMPTY_NUTRIENTS;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm animate-pulse">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-6 lg:grid grid-cols-2">
      {nutrients.map((nutrient) => (
        <UserProgressBar
          key={nutrient.id}
          title={nutrient.title}
          currentValue={nutrient.currentValue}
          limit={nutrient.limit}
          unit={nutrient.unit}
        />
      ))}
    </div>
  );
}

// import { Card, CardContent, CardHeader } from '@/components/ui/card';
// import { Field, FieldLabel } from '@/components/ui/field';
// import { Progress } from '@/components/ui/progress';

// interface NutrientProgressProps {
//   title: string;
//   currentValue: number;
//   limit: number; // required since every nutrient has a unique cap
//   unit: string; // e.g., "g", "mg", "kcal"
// }

// export function UserProgressBar({ title, currentValue, limit, unit }: NutrientProgressProps) {
//   const percentage = (currentValue / limit) * 100;
//   const displayPercentage = Math.min(percentage, 100);

//   return (
//     <Card className="flex flex-row items-center w-full">
//       <CardHeader className='flex flex-col w-2/5 items-center justify-center p-3'>
//         <span className="text-xs font-medium leading-none">
//           {currentValue}
//           {unit} /

//         </span>
//         <span className="text-muted-foreground/60 text-[9px]">
//             {limit}
//             {unit}
//           </span>
//       </CardHeader>
//       <CardContent className="flex flex-row w-full items-center pb-3">
//         <Field className="w-full max-w-sm gap-0">
//           <FieldLabel
//             htmlFor={`intake-${title.toLowerCase()}`}
//             className="flex justify-between items-end w-full mb-1"
//           >
//             <span className="text-xs tracking-wider text-muted-foreground font-semibold">
//               {title}
//             </span>
//             <span
//               className={`text-xs font-bold ${percentage > 100 ? 'text-destructive' : 'text-primary'}`}
//             >
//               {Math.round(percentage)}%
//             </span>
//           </FieldLabel>

//           <Progress
//             value={displayPercentage}
//             id={`intake-${title.toLowerCase()}`}
//             className="h-2"
//           />
//         </Field>
//       </CardContent>
//     </Card>
//   );
// }
