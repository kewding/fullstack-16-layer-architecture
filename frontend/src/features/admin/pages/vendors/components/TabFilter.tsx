// TabFilter.tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabType = 'review' | 'stalls';

interface AdminActionsTabFilterProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; title: string }[] = [
  { id: 'review', title: 'Onboarding' },
  { id: 'stalls', title: 'Active Vendors' },
];

export function AdminActionsTabFilter({
  activeTab,
  onTabChange,
}: AdminActionsTabFilterProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as TabType)}
      className="w-full"
    >
      <TabsList
        className="
          h-auto
          rounded-2xl
          border
          bg-muted/40
          p-1
          flex
          w-full
          flex-col
          gap-1
          sm:w-fit
          sm:flex-row
        "
      >
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="
              h-11
              rounded-xl
              px-5
              text-sm
              font-medium
              transition-all
              data-[state=active]:bg-background
              data-[state=active]:shadow-sm
            "
          >
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}