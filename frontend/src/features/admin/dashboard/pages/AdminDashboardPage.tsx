import React from 'react';
import { KpiCardsSection } from '../components/KpiCardsSection';
import { RevenueSection } from '../components/RevenueSection';

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-3">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <KpiCardsSection />
        <RevenueSection />
      </main>
    </div>
  );
};
