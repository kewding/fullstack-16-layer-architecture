import DateRangePicker, { type FlexibleDateRange } from './DateFilter';
import SearchFilter from './SearchFilter';
import TabFilter, { type UserTab } from './TabFIlter';

interface NavigationSectionProps {
  tab: UserTab;
  onTabChange: (tab: UserTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: FlexibleDateRange;
  onDateRangeChange: (range: FlexibleDateRange) => void;
}

export default function NavigationSection({
  tab,
  onTabChange,
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: NavigationSectionProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <TabFilter activeTab={tab} onChange={onTabChange} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchFilter value={search} onChange={onSearchChange} />
        <DateRangePicker dateRange={dateRange} setDateRange={onDateRangeChange} />
      </div>
    </div>
  );
}
