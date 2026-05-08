import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useCallback, useEffect, useState } from 'react';
import { CustomerFilters, VendorFilters } from './components/navigation-section';
import type { FlexibleDateRange } from './components/navigation-section/DatePicker';
import { TransactionsTable } from './components/TransactionsTable';
import { CUSTOMER_TX_COLUMNS } from './constants/customerColumns';
import { VENDOR_TX_COLUMNS } from './constants/vendorColumns';
import { useDebounce } from './hooks/useDebounce';
import type {
  CustomerTxRow,
  CustomerTxType,
  MainTabType,
  VendorTxRow,
  VendorTxType,
} from './schemas/transactions.schema';
import { transactionService } from './services/transaction.service';

const AUTO_REFRESH_MS = 30_000; // 30 seconds

export const AdminTransactionsPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTabType>('vendor');

  // Vendor state
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorType, setVendorType] = useState<VendorTxType>('');
  const [vendorDateRange, setVendorDateRange] = useState<FlexibleDateRange>({
    start: null,
    end: null,
  });
  const [vendorPage, setVendorPage] = useState(1);
  const [vendorData, setVendorData] = useState<VendorTxRow[]>([]);
  const [vendorTotal, setVendorTotal] = useState(0);
  const [vendorTotalPages, setVendorTotalPages] = useState(1);
  const [vendorLoading, setVendorLoading] = useState(false);

  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerType, setCustomerType] = useState<CustomerTxType>('');
  const [customerDateRange, setCustomerDateRange] = useState<FlexibleDateRange>({
    start: null,
    end: null,
  });
  const [customerPage, setCustomerPage] = useState(1);
  const [customerData, setCustomerData] = useState<CustomerTxRow[]>([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Debounced search values
  const debouncedVendorSearch = useDebounce(vendorSearch, 400);
  const debouncedCustomerSearch = useDebounce(customerSearch, 400);

  const fetchVendor = useCallback(async () => {
    setVendorLoading(true);
    try {
      const res = await transactionService.listVendorTransactions(
        vendorPage,
        debouncedVendorSearch,
        vendorType,
        vendorDateRange.start ? vendorDateRange.start.toISOString().split('T')[0] : '',
        vendorDateRange.end ? vendorDateRange.end.toISOString().split('T')[0] : '',
      );
      setVendorData(res.data);
      setVendorTotal(res.total);
      setVendorTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch vendor transactions:', err);
    } finally {
      setVendorLoading(false);
    }
  }, [vendorPage, debouncedVendorSearch, vendorType, vendorDateRange]);

  const fetchCustomer = useCallback(async () => {
    setCustomerLoading(true);
    try {
      const res = await transactionService.listCustomerTransactions(
        customerPage,
        debouncedCustomerSearch,
        customerType,
        customerDateRange.start ? customerDateRange.start.toISOString().split('T')[0] : '',
        customerDateRange.end ? customerDateRange.end.toISOString().split('T')[0] : '',
      );
      setCustomerData(res.data);
      setCustomerTotal(res.total);
      setCustomerTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch customer transactions:', err);
    } finally {
      setCustomerLoading(false);
    }
  }, [customerPage, debouncedCustomerSearch, customerType, customerDateRange]);

  // Reset pages when filters change
  useEffect(() => {
    setVendorPage(1);
  }, [debouncedVendorSearch, vendorType, vendorDateRange]);
  useEffect(() => {
    setCustomerPage(1);
  }, [debouncedCustomerSearch, customerType, customerDateRange]);

  // Fetch on dependency change
  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);
  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (mainTab === 'vendor') fetchVendor();
      else fetchCustomer();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [mainTab, fetchVendor, fetchCustomer]);

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">Transactions</h1>

        {/* Main tab — Vendor vs Customer */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)}>
          <TabsList className="flex flex-row h-auto w-auto bg-transparent p-0 gap-2">
            <TabsTrigger value="vendor" className="px-4 py-2 rounded-lg">
              Vendor Transactions
            </TabsTrigger>
            <TabsTrigger value="customer" className="px-4 py-2 rounded-lg">
              Customer Transactions
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mainTab === 'vendor' ? (
          <>
            <VendorFilters
              search={vendorSearch}
              onSearchChange={setVendorSearch}
              type={vendorType}
              onTypeChange={setVendorType}
              dateRange={vendorDateRange}
              onDateRangeChange={setVendorDateRange}
            />
            <TransactionsTable
              columns={VENDOR_TX_COLUMNS}
              data={vendorData}
              isLoading={vendorLoading}
              page={vendorPage}
              totalPages={vendorTotalPages}
              total={vendorTotal}
              onPageChange={setVendorPage}
              label="vendor transactions"
            />
          </>
        ) : (
          <>
            <CustomerFilters
              search={customerSearch}
              onSearchChange={setCustomerSearch}
              type={customerType}
              onTypeChange={setCustomerType}
              dateRange={customerDateRange}
              onDateRangeChange={setCustomerDateRange}
            />
            <TransactionsTable
              columns={CUSTOMER_TX_COLUMNS}
              data={customerData}
              isLoading={customerLoading}
              page={customerPage}
              totalPages={customerTotalPages}
              total={customerTotal}
              onPageChange={setCustomerPage}
              label="customer transactions"
            />
          </>
        )}
      </main>
    </div>
  );
};
