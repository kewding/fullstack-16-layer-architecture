import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TransactionTabFilterTypesEnum = ['All', 'Purchases', 'Top-ups', 'Remmitances'];

const TransactionTabFilter = TransactionTabFilterTypesEnum.map((items) => ({
  id: items.toLowerCase().replace('-', ''),
  title: items,
}));

export function TrsansactionsTabFilter() {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList
        className="
    flex flex-col h-auto w-full justify-start gap-2 bg-transparent p-0 
    lg:flex-row lg:w-auto
  "
      >
        {TransactionTabFilter.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="
          w-full lg:w-auto h-auto px-4 py-2 
          bg-transparent border-none rounded-lg 
        "
          >
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
