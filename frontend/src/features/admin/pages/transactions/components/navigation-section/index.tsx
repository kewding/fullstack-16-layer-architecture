import { useState } from 'react';
import DateRangePicker, { type FlexibleDateRange } from './DatePicker';
import { ExportSelectedData } from './ExportButton';
import { SearchFilter } from './SearchFilter';
import { TrsansactionsTabFilter } from './TabFilter';

export function NavigationSection() {
  const [selectedDate, setSelectedDate] = useState<FlexibleDateRange>({
    start: null,
    end: null,
  });

  return (
    <div className="grid w-full gap-4 grid-rows-4 grid-cols-2 lg:grid-rows-1 lg:grid-flow-col justify-between">
      <TrsansactionsTabFilter />
      <div className="grid w-full gap-2 grid-rows-4 grid-cols-1 lg:grid-rows-1 lg:grid-flow-col justify-between">
        <SearchFilter />
        <DateRangePicker dateRange={selectedDate} setDateRange={setSelectedDate} />
        <ExportSelectedData />
      </div>
    </div>
  );
}
