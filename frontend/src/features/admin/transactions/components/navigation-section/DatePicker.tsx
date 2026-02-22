import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

export type FlexibleDateRange = {
  start: Date | null | undefined;
  end: Date | null | undefined;
};

interface DateRangePickerPInput {
  dateRange: FlexibleDateRange;
  setDateRange: (range: FlexibleDateRange) => void;
}

export default function DateRangePicker({ dateRange, setDateRange }: DateRangePickerPInput) {
  const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

  const startDateInput = dateRange.start ? dateRange.start.toISOString().split('T')[0] : '';
  const endDateInput = dateRange.end ? dateRange.end.toISOString().split('T')[0] : '';

  const handleDateChange = (field: 'start' | 'end') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setDateRange({ ...dateRange, [field]: null });
      return;
    }

    const [year, month, day] = val.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    setDateRange({
      ...dateRange,
      [field]: localDate,
    });
  };

  const clear = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setDateRange({ start: null, end: null });
  };

  return (
    <div className="grid gap-2 text-black">
      <Popover>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: 'outline' }),
            !dateRange.start && 'justify-between text-left font-medium p-3 text-black',
          )}
        >
          <CalendarIcon className="mr-2 size-4" />

          {dateRange.start && dateRange.end
            ? isSameDay(dateRange.start, dateRange.end)
              ? dateFormat.format(dateRange.start)
              : `${dateFormat.format(dateRange.start)} - ${dateFormat.format(dateRange.end)}`
            : dateRange.start
              ? dateFormat.format(dateRange.start)
              : 'Pick a date'}

          {(dateRange.start || dateRange.end) && (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={(e) => e.key === 'Enter' && clear(e)}
              className="ml-auto cursor-pointer "
            >
              <X className="stroke-red-500" />
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0 fill-[#243c5a]" align="start">
          <div className="flex w-full flex-row justify-evenly gap-4 p-4 ">
            <div className="flex flex-col gap-1">
              <label htmlFor="startDate" className="text-center text-sm">
                Start Date
              </label>
              <Input
                type="date"
                id="startDate"
                value={startDateInput}
                onChange={handleDateChange('start')}
                className="custom-date-input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="endDate" className="text-center text-sm">
                End Date
              </label>
              <Input
                type="date"
                id="endDate"
                value={endDateInput}
                onChange={handleDateChange('end')}
                className="custom-date-input"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
