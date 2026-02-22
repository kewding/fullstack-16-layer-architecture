import React from 'react';
import { UserBalanceSection } from './components/BalanceSection';
import { UserPurchasesSection } from './components/PurchasesSection';
import { UPFIndicatorSection } from './components/UpfIndicatorSection';

//make sure to remove this or transport this to another file later
const Name: string = 'Kenneth';
const now = new Date();

//date
const localFormattedDate = now.toLocaleDateString('en-GB', {
  weekday: 'long', // "Week"
  day: 'numeric', // "Day"
  month: 'short', // "Month"
  year: 'numeric', // "Year"
});

export const UserDashboardPage: React.FC = () => {
  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full h-full gap-3">
        <div className="flex flex-col w-full gap-0">
          <h1 className="text-2xl font-semibold">Hello, {Name}</h1>
          <span className="text-sm">{localFormattedDate}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-1">
            <UserBalanceSection />
            <UserPurchasesSection />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <UPFIndicatorSection />
          </div>
        </div>
      </main>
    </div>
  );
};
