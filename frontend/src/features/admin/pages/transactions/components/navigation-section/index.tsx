import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import DateRangePicker, { type FlexibleDateRange } from './DatePicker';
import type { CustomerTxType, VendorTxType } from '../../schemas/transactions.schema';

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
  search, onSearchChange, type, onTypeChange, dateRange, onDateRangeChange,
}: VendorFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={type} onValueChange={(v) => onTypeChange(v as VendorTxType)}>
        <TabsList className="flex flex-col h-auto w-full justify-start gap-2 bg-transparent p-0 lg:flex-row lg:w-auto">
          {VENDOR_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}
              className="w-full lg:w-auto h-auto px-4 py-2 bg-transparent border-none rounded-lg">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by stall name or owner"
            className="pl-10"
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
  search, onSearchChange, type, onTypeChange, dateRange, onDateRangeChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={type} onValueChange={(v) => onTypeChange(v as CustomerTxType)}>
        <TabsList className="flex flex-col h-auto w-full justify-start gap-2 bg-transparent p-0 lg:flex-row lg:w-auto">
          {CUSTOMER_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}
              className="w-full lg:w-auto h-auto px-4 py-2 bg-transparent border-none rounded-lg">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer name"
            className="pl-10"
          />
        </div>
        <DateRangePicker dateRange={dateRange} setDateRange={onDateRangeChange} />
      </div>
    </div>
  );
}