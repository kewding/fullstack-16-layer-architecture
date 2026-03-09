import React from 'react';
import { TaggingField } from './components/TaggingField';

export const CashierRfidTaggingPage: React.FC = () => {
  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">RFID Tagging</h1>
        <TaggingField />
      </main>
    </div>
  );
};
