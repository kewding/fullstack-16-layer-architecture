import React, { useState } from 'react';
import { VendorsTable } from './components/VendorsTable';
import { VENDORS_STATUS_TABLE_COLUMNS } from './constants/vendorsStatusTableColumns';
import { VENDORS_BALANCE_TABLE_COLUMNS } from './constants/vendorsBalanceTableColumns';
import { NavigationSection } from './components/NavigationSection';

export const AdminVendorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'review' | 'balance'>('review');

  // replace with real data fetch later
  const data: any[] = [];
  const isLoading = false;

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <NavigationSection activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'review' ? (
          <VendorsTable columns={VENDORS_STATUS_TABLE_COLUMNS} data={data} isLoading={isLoading} />
        ) : (
          <VendorsTable columns={VENDORS_BALANCE_TABLE_COLUMNS} data={data} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
};