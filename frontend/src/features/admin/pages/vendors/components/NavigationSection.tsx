import { VendorInviteButton } from './InviteButton';
import { SearchFilter } from './SearchFilter';
import { AdminActionsTabFilter } from './TabFilter';

type TabType = 'review' | 'balance';

interface NavigationSectionProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function NavigationSection({ activeTab, onTabChange }: NavigationSectionProps) {
  return (
    <div className="grid w-full gap-4 grid-rows-4 grid-cols-2 lg:grid-rows-1 lg:grid-flow-col justify-between">
      <AdminActionsTabFilter activeTab={activeTab} onTabChange={onTabChange} />
      <div className="grid w-full gap-2 grid-rows-4 grid-cols-1 lg:grid-rows-1 lg:grid-flow-col justify-between">
        <SearchFilter />
        <VendorInviteButton />
      </div>
    </div>
  );
}