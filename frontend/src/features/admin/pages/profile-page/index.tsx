import { Card } from '@/components/ui/card';
import React from 'react';
import { PersonalInfoForm } from './components/PersonalInfoForm';

export const AdminProfilePage: React.FC = () => {
  return (
    <div className="flex px-1 w-full">
      <main className="flex flex-col w-full gap-6">
        <h1 className="text-2xl font-semibold">Information</h1>
        <Card className="p-6 flex flex-col gap-8">
          <PersonalInfoForm />
        </Card>
      </main>
    </div>
  );
};
