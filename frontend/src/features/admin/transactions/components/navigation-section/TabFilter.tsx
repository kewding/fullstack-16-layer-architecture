import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TransactionTabFilterTypesEnum = ['All', 'Purchases', 'Top-ups', 'Remmitances'];

const TransactionTabFilter = TransactionTabFilterTypesEnum.map((items) => ({
  id: items.toLowerCase().replace('-', ''),
  title: items,
}));

export function TrsansactionsTabFilter() {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="flex w-full justify-start gap-2 bg-transparent border-none p-0 h-auto">
        {TransactionTabFilter.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className='w-auto border-none text-sm bg-transparent rounded-lg'>
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
