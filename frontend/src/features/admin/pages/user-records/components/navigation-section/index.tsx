import DateRangePicker, { type FlexibleDateRange } from './DateFilter';
import SearchFilter from './SearchFilter';
import { type UserTab } from './TabFIlter';

interface NavigationSectionProps {
  tab: UserTab;
  onTabChange: (tab: UserTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: FlexibleDateRange;
  onDateRangeChange: (range: FlexibleDateRange) => void;
}

export default function NavigationSection({
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: NavigationSectionProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <div className="flex items-center">
        <p className="text-sm font-medium text-muted-foreground">Filter users</p>
      </div>

      {/* Right */}

      <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
        <SearchFilter value={search} onChange={onSearchChange} />

        <DateRangePicker dateRange={dateRange} setDateRange={onDateRangeChange} />
      </div>
    </div>
  );
}
