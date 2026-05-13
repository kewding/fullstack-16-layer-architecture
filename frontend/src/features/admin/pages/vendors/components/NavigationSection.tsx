// NavigationSection.tsx
import { VendorInviteButton } from './InviteButton';
import { SearchFilter } from './SearchFilter';

type TabType = 'review' | 'stalls';

interface NavigationSectionProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onInvited: () => void;
}

export function NavigationSection({
  // activeTab,
  // onTabChange,
  search,
  onSearchChange,
  onInvited,
}: NavigationSectionProps) {
  return (
    <div className="flex flex-row justify-between xl:flex-row xl:items-center xl:justify-between">
      {/* <AdminActionsTabFilter
        activeTab={activeTab}
        onTabChange={onTabChange}
      /> */}

      <div className="flex flex-row gap-3 sm:flex-row sm:items-center">
        <SearchFilter value={search} onChange={onSearchChange} />

        <VendorInviteButton onInvited={onInvited} />
      </div>
    </div>
  );
}
