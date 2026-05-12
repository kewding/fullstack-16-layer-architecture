import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import type { CustomerTxType, VendorTxType } from '../../schemas/transactions.schema';
import DateRangePicker, { type FlexibleDateRange } from './DatePicker';

interface VendorFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  type: VendorTxType;
  onTypeChange: (v: VendorTxType) => void;
  dateRange: FlexibleDateRange;
  onDateRangeChange: (v: FlexibleDateRange) => void;
}

const VENDOR_TABS: { id: VendorTxType; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'sale', label: 'Sale' },
  { id: 'remittance', label: 'Remittance' },
];

export function VendorFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  dateRange,
  onDateRangeChange,
}: VendorFiltersProps) {
  return (
    <div className="flex flex-col gap-4 align-middle lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}
      <Tabs value={type} onValueChange={(v) => onTypeChange(v as VendorTxType)}>
        <TabsList className="flex h-auto flex-wrap items-center gap-2 bg-transparent p-0">
          {VENDOR_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="
    h-auto rounded-none
    bg-transparent
    px-4 py-2
    text-sm text-muted-foreground
    shadow-none
    transition-colors

    hover:text-foreground

    data-[state=active]:border-b-[#CD9A34]
    data-[state=active]:text-[#CD9A34]
    data-[state=active]:bg-transparent
    data-[state=active]:shadow-none
  "
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Right */}
      <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
        <div className="relative w-full sm:w-[320px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>

          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by stall name or owner"
            className="h-10 pl-10"
          />
        </div>

        <DateRangePicker dateRange={dateRange} setDateRange={onDateRangeChange} />
      </div>
    </div>
  );
}

interface CustomerFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  type: CustomerTxType;
  onTypeChange: (v: CustomerTxType) => void;
  dateRange: FlexibleDateRange;
  onDateRangeChange: (v: FlexibleDateRange) => void;
}

const CUSTOMER_TABS: { id: CustomerTxType; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'top-up', label: 'Top-up' },
  { id: 'refund', label: 'Refund' },
  { id: 'withdraw', label: 'Withdraw' },
];

export function CustomerFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  dateRange,
  onDateRangeChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-4 align-middle lg:flex-row lg:items-center lg:justify-between">
      {/* Left */}

      <Tabs value={type} onValueChange={(v) => onTypeChange(v as CustomerTxType)}>
        <TabsList className="flex h-auto flex-wrap items-center gap-2 bg-transparent p-0">
          {CUSTOMER_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="
    h-auto rounded-none
    bg-transparent
    px-4 py-2
    text-sm text-muted-foreground
    shadow-none
    transition-colors

    hover:text-foreground

    data-[state=active]:border-b-[#CD9A34]
    data-[state=active]:text-[#CD9A34]
    data-[state=active]:bg-transparent
    data-[state=active]:shadow-none
  "
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Right */}
      <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
        <div className="relative w-full sm:w-[320px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>

          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer name"
            className="h-10 pl-10"
          />
        </div>

        <DateRangePicker dateRange={dateRange} setDateRange={onDateRangeChange} />
      </div>
    </div>
  );
}
