import React, { useState } from 'react';
import { taggingService } from '../../services/tagging.service';
import { TaggingForm } from './components/TaggingForm';
import type { TaggingInput } from './schemas/tagging.schema';

export const CashierRfidTaggingPage: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTagging = async (data: TaggingInput) => {
    setServerError(null);
    setSuccess(false);

    const response = await taggingService.submitTagging(data);

    if (!response.success) {
      // response.error.code lets you handle specific cases differently
      setServerError(response.error?.message ?? 'Something went wrong.');
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">RFID Tagging</h1>
        {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
        {success && <p className="text-green-500 text-sm">RFID tagged successfully.</p>}
        <TaggingForm onSubmit={handleTagging} />
      </main>
    </div>
  );
};
