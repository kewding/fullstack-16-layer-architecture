import { cn } from '@/lib/utils';

export type UserTab = 'active' | 'inactive';

interface TabFilterProps {
  activeTab: UserTab;
  onChange: (tab: UserTab) => void;
}

const TABS: { label: string; value: UserTab }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default function TabFilter({ activeTab, onChange }: TabFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
            activeTab === tab.value
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}