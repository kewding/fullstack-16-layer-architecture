import { useState } from 'react';
import { TopUpForm } from './components/TopUpForm';
import type { TopupInput } from './schemas/topup.schema';
import { topupService } from '../../services/topup.service';

export const CashierTopUpPage: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTopup = async (data: TopupInput) => {
    setServerError(null);
    setSuccess(false);

    const response = await topupService.submitTopup(data);

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
        <h1 className="text-2xl font-semibold">Top-Up</h1>
        {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
        {success && <p className="text-green-500 text-sm">credit successfully.</p>}
        <TopUpForm onSubmit={handleTopup} />
      </main>
    </div>
  );
};
