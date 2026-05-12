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

    // Ensure we create a valid Date object from the YYYY-MM-DD string
    const newDate = new Date(val);
    if (!isNaN(newDate.getTime())) {
      setDateRange({
        ...dateRange,
        [field]: newDate,
      });
    }
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
            `
              h-11 min-w-[240px]
              justify-between
              rounded-xl
              border-[hsl(var(--border))]
             bg-white
              px-4
              text-sm font-medium
              text-[hsl(var(--foreground))]
            `,
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

        <PopoverContent
          className="
    w-auto rounded-2xl border
    border-[hsl(var(--border))]
    p-0 shadow-xl
  "
          align="start"
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row">
            <div className="flex flex-col gap-2">
              <label htmlFor="startDate" className="text-xs font-medium text-muted-foreground">
                From
              </label>

              <Input
                type="date"
                id="startDate"
                value={startDateInput}
                onChange={handleDateChange('start')}
                className="h-10 bg-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="endDate" className="text-xs font-medium text-muted-foreground">
                To
              </label>

              <Input
                type="date"
                id="endDate"
                value={endDateInput}
                onChange={handleDateChange('end')}
                className="h-10 bg-white"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
