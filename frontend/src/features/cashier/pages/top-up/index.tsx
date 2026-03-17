import { useState } from 'react';
import { topupService, type TopupData } from '../../services/topup.service';
import { userService, type UserData } from '../../services/user.service';
import { ReceiptModal } from './components/Reciept';
import { TopUpForm } from './components/TopUpForm';
import type { TopupInput } from './schemas/topup.schema';

export const CashierTopUpPage: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TopupData | null>(null);
  const [receiptUser, setReceiptUser] = useState<UserData | null>(null);
  const [formKey, setFormKey] = useState(0); // increment to reset form

  const handleTopup = async (data: TopupInput) => {
    setServerError(null);

    const response = await topupService.submitTopup(data);

    if (!response.success) {
      setServerError(response.error?.message ?? 'Something went wrong.');
      return;
    }

    // Fetch user details for receipt
    try {
      const user = await userService.getUserById(response.data!.user_id);
      setReceiptUser(user);
      setReceipt(response.data!);
    } catch {
      // Top-up succeeded — still show receipt with fallback name
      setReceiptUser({
        user_id: response.data!.user_id,
        first_name: 'Unknown',
        middle_name: '',
        last_name: 'User',
      });
      setReceipt(response.data!);
    }
  };

  const handleClose = () => {
    setReceipt(null);
    setReceiptUser(null);
    setFormKey((k) => k + 1); // resets the form
  };

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">Top-Up</h1>
        {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
        <TopUpForm key={formKey} onSubmit={handleTopup} />
      </main>

      {receipt && receiptUser && (
        <ReceiptModal receipt={receipt} user={receiptUser} onClose={handleClose} />
      )}
    </div>
  );
};
