import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabType = 'review' | 'balance';

interface AdminActionsTabFilterProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; title: string }[] = [
  { id: 'review', title: 'Review' },
  { id: 'balance', title: 'Balance' },
];

export function AdminActionsTabFilter({ activeTab, onTabChange }: AdminActionsTabFilterProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabType)} className="w-full">
      <TabsList className="flex flex-col h-auto w-full justify-start gap-2 bg-transparent p-0 lg:flex-row lg:w-auto">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="w-full lg:w-auto h-auto px-4 py-2 bg-transparent border-none rounded-lg"
          >
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}