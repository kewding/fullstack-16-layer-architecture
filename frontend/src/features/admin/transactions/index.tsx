import React from 'react';
import { NavigationSection } from './components/navigation-section';
import { TransactionsSalesTable } from './components/navigation-section/SalesTable';
import { SALES_TABLE_COLUMNS } from './constants/salesTableColumns';
import { useTransactions } from './hooks/useTransaction';

export const AdminTransactionsPage: React.FC = () => {
  const { data, isLoading, isError, error } = useTransactions();

  // 1. Handle Error State (Infrastructure/Network failure)
  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-red-500">
        <p>
          Error loading transactions: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <NavigationSection/>
        <TransactionsSalesTable columns={SALES_TABLE_COLUMNS} data={data ?? []} isLoading={isLoading} />
      </main>
    </div>
  );
};
