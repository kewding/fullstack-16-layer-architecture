import { TopUpForm } from "./components/TopUpForm";

export const CashierTopUpPage: React.FC = () => {
  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">Top-Up</h1>
        <TopUpForm/>
      </main>
    </div>
  );
};
