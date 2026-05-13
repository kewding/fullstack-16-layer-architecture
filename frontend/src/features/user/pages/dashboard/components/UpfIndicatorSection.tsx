// src/features/user/pages/dashboard/components/UpfIndicatorSection.tsx

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import type { NutritionData } from '../services/dashboard.service';

interface UPFIndicatorSectionProps {
  data: NutritionData | null;
  loading: boolean;
}

interface UPFMetric {
  nutrient: string;
  value: number; // today's intake
  limit: number; // user-specific limit
  fill: string;
}

function buildMetrics(data: NutritionData): UPFMetric[] {
  return [
    {
      nutrient: 'Calories',
      value: data.totals.calories_kcal,
      limit: data.limits.calories_kcal,
      fill: 'hsl(var(--chart-1))',
    },
    {
      nutrient: 'Sodium',
      value: data.totals.sodium_mg,
      limit: data.limits.sodium_mg,
      fill: 'hsl(var(--chart-2))',
    },
    {
      nutrient: 'Sugar',
      value: data.totals.sugar_g,
      limit: data.limits.sugar_g,
      fill: 'hsl(var(--chart-3))',
    },
    {
      nutrient: 'Fat',
      value: data.totals.total_fat_g,
      limit: data.limits.total_fat_g,
      fill: 'hsl(var(--chart-4))',
    },
  ];
}

export function UPFIndicatorSection({ data, loading }: UPFIndicatorSectionProps) {
  const metrics: UPFMetric[] = data
    ? buildMetrics(data)
    : [
        { nutrient: 'Calories', value: 0, limit: 1, fill: 'hsl(var(--chart-1))' },
        { nutrient: 'Sodium', value: 0, limit: 1, fill: 'hsl(var(--chart-2))' },
        { nutrient: 'Sugar', value: 0, limit: 1, fill: 'hsl(var(--chart-3))' },
        { nutrient: 'Fat', value: 0, limit: 1, fill: 'hsl(var(--chart-4))' },
      ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-1">
        <CardDescription>Ultra Processed Food Tracking</CardDescription>
      </CardHeader>
      <CardContent className="w-full h-full">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm animate-pulse">
            Loading…
          </div>
        ) : (
          <div className="flex flex-row justify-between items-center p-0 w-full">
            {metrics.map((item) => {
              const pct =
                item.limit > 0 ? Math.min(Math.round((item.value / item.limit) * 100), 100) : 0;

              return (
                <div
                  key={item.nutrient}
                  className="flex flex-col items-center flex-1 min-w-0 aspect-square p-0"
                >
                  <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={8}
                        data={[{ ...item, value: item.value }]}
                        startAngle={90}
                        endAngle={450}
                      >
                        <PolarAngleAxis
                          type="number"
                          domain={[0, item.limit]}
                          angleAxisId={0}
                          tick={false}
                        />
                        <RadialBar background dataKey="value" cornerRadius={5} fill={item.fill} />
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-foreground text-xl font-bold"
                        >
                          {`${pct}%`}
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="text-base font-medium text-muted-foreground mt-1 truncate w-full text-center">
                    {item.nutrient}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
// import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
// import { healthMetrics } from '../constants/mockUpfData';

// //ultra processed food
// export function UPFIndicatorSection() {
//   return (
//     <Card className="w-full">
//       <CardHeader className="pb-1">
//         <CardDescription>Ultra Processed Food Tracking</CardDescription>
//       </CardHeader>
//       <CardContent className="w-full h-full">
//         <div className="flex flex-row justify-between items-center p-0 w-full">
//           {healthMetrics.map((item) => (
//             <div
//               key={item.nutrient}
//               className="flex flex-col items-center flex-1 min-w-0 aspect-square p-0"
//             >
//               <div className="w-full h-full">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <RadialBarChart
//                     innerRadius="70%"
//                     outerRadius="100%"
//                     barSize={8}
//                     data={[item]}
//                     startAngle={90}
//                     endAngle={450}
//                   >
//                     <PolarAngleAxis
//                       type="number"
//                       domain={[0, item.limit]}
//                       angleAxisId={0}
//                       tick={false}
//                     />
//                     <RadialBar background dataKey="value" cornerRadius={5} fill={item.fill} />
//                     <text
//                       x="50%"
//                       y="50%"
//                       textAnchor="middle"
//                       dominantBaseline="middle"
//                       className="fill-foreground text-xl font-bold sm:text-xl"
//                     >
//                       {`${item.value}%`}
//                     </text>
//                   </RadialBarChart>
//                 </ResponsiveContainer>
//               </div>
//               <span className="text-base font-medium text-muted-foreground mt-1 truncate w-full text-center">
//                 {item.nutrient}
//               </span>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
