// src/features/user/pages/dashboard/index.tsx

import { useAuth } from '@/app/providers/AuthProvider';
import { Card } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { UserBalanceSection } from './components/BalanceSection';
import { NutritionIntakeSection } from './components/NutritionIntakeSection';
import { UserPurchasesSection } from './components/PurchasesSection';
import { UPFIndicatorSection } from './components/UpfIndicatorSection';
import {
  userDashboardService,
  type NutritionData,
  type PurchaseItem,
} from './services/dashboard.service';

const now = new Date();

const localFormattedDate = now.toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // ── Nutrition state ─────────────────────────────────────────────────────────
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(true);

  // ── Purchases state ─────────────────────────────────────────────────────────
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchNutrition = async () => {
      try {
        const data = await userDashboardService.getNutrition();
        setNutritionData(data);
      } catch {
        // Sections render with zero values — no error banner needed
      } finally {
        setNutritionLoading(false);
      }
    };

    const fetchPurchases = async () => {
      try {
        const data = await userDashboardService.getRecentPurchases();
        setPurchases(data.items);
      } catch {
        setPurchasesError('Failed to load purchases.');
      } finally {
        setPurchasesLoading(false);
      }
    };

    fetchNutrition();
    fetchPurchases();
  }, []);

  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full h-full gap-3">
        {/* Header */}
        <div className="flex flex-col w-full gap-0">
          <h1 className="text-2xl font-semibold">Hello, {user?.firstName ?? '—'}</h1>
          <span className="text-sm">{localFormattedDate}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <UserBalanceSection />
            <UserPurchasesSection
              items={purchases}
              loading={purchasesLoading}
              error={purchasesError}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <UPFIndicatorSection data={nutritionData} loading={nutritionLoading} />
            <Card>
              <NutritionIntakeSection data={nutritionData} loading={nutritionLoading} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
// import { Card } from '@/components/ui/card';
// import React from 'react';
// import { UserBalanceSection } from './components/BalanceSection';
// import { UserProgressBar } from './components/NutritionIntakeSection';
// import { UserPurchasesSection } from './components/PurchasesSection';
// import { UPFIndicatorSection } from './components/UpfIndicatorSection';
// import { NUTRITION_DATA } from './constants/mockNutriIntake';

// //make sure to remove this or transport this to another file later
// const Name: string = 'Kenneth';
// const now = new Date();

// //date
// const localFormattedDate = now.toLocaleDateString('en-GB', {
//   weekday: 'long', // "Week"
//   day: 'numeric', // "Day"
//   month: 'short', // "Month"
//   year: 'numeric', // "Year"
// });

// export const UserDashboardPage: React.FC = () => {
//   return (
//     <div className="flex px-1 w-full">
//       <main className="flex flex-col w-full h-full gap-3">
//         <div className="flex flex-col w-full gap-0">
//           <h1 className="text-2xl font-semibold">Hello, {Name}</h1>
//           <span className="text-sm">{localFormattedDate}</span>
//         </div>

//         <div className="grid grid-cols-1 gap-4 w-full lg:grid-cols-3">
//           <div className="flex flex-col gap-4 lg:col-span-1">
//             <UserBalanceSection />
//             <UserPurchasesSection />
//           </div>

//           <div className="flex flex-col gap-4 lg:col-span-2">
//             <UPFIndicatorSection />
//             <Card className='flex flex-col gap-2 p-6 lg:grid grid-cols-2'>
//               {NUTRITION_DATA.map((nutrient) => (
//                 <UserProgressBar
//                   key={nutrient.id}
//                   title={nutrient.title}
//                   currentValue={nutrient.currentValue}
//                   limit={nutrient.limit}
//                   unit={nutrient.unit}
//                 />
//               ))}
//             </Card>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };
