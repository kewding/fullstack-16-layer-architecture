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
    <div className="flex items-center gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            `
      rounded-xl px-4 py-2 text-sm font-medium normal-case
      transition-all duration-200
    `,
            activeTab === tab.value
              ? `
          border border-[hsl(var(--border))]
          bg-white
          text-[#3f6f64]
          shadow-sm
        `
              : `
          text-[#CD9A34]
          hover:bg-[hsl(var(--muted))]/40
          hover:text-[hsl(var(--foreground))]
        `,
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
