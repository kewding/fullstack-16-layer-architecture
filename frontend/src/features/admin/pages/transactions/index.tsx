// AdminTransactionsPage.tsx

import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AUTO_REFRESH_MS = 30_000;

export const AdminTransactionsPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<MainTabType>('vendor');

  // Vendor
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

  // Customer
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
      console.error(err);
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
      console.error(err);
    } finally {
      setCustomerLoading(false);
    }
  }, [customerPage, debouncedCustomerSearch, customerType, customerDateRange]);

  useEffect(() => {
    setVendorPage(1);
  }, [debouncedVendorSearch, vendorType, vendorDateRange]);

  useEffect(() => {
    setCustomerPage(1);
  }, [debouncedCustomerSearch, customerType, customerDateRange]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mainTab === 'vendor') {
        fetchVendor();
      } else {
        fetchCustomer();
      }
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [mainTab, fetchVendor, fetchCustomer]);

  const total = mainTab === 'vendor' ? vendorTotal : customerTotal;

  return (
    <div className="w-full px-1">
      <main className="flex flex-col gap-5">
        {/* ───────────────── Header ───────────────── */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage and monitor all vendor and customer transaction activity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full bg-[#cd9a34] px-3 py-1 text-xs font-semibold text-white">
              {total.toLocaleString()} total
            </div>

            <Button variant="outline" size="sm" className="h-9 rounded-lg">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ───────────────── Connected Tabs + Content ───────────────── */}

        <div className="flex flex-col gap-0 ">
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)}>
            <TabsList className="h-auto justify-start gap-1 bg-transparent p-0">
              <TabsTrigger
                value="vendor"
                className="
                relative rounded-t-xl rounded-b-none
                border-none
                bg-muted/40
                px-5 py-2.5
                text-sm font-medium text-muted-foreground
                transition-none
                ring-non

                data-[state=active]:z-10
                data-[state=active]:bg-white
                data-[state=active]:border-border
                data-[state=active]:border-b-background
                data-[state=active]:text-foreground
                data-[state=active]:shadow-none
                data-[state=active]:border-none

                focus-visible:outline-none
focus-visible:ring-0
focus-visible:ring-offset-0
              "
              >
                Vendor Transactions
              </TabsTrigger>

              <TabsTrigger
                value="customer"
                className="
                relative rounded-t-xl rounded-b-none
                border-none
                bg-muted/40
                px-5 py-2.5
                text-sm font-medium text-muted-foreground
                transition-none

                data-[state=active]:z-10
                data-[state=active]:bg-white
                data-[state=active]:text-foreground
                data-[state=active]:shadow-none
                data-[state=active]:border-none

                focus-visible:outline-none
focus-visible:ring-0
focus-visible:ring-offset-0
              "
              >
                Customer Transactions
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ───────────────── Connected Surface ───────────────── */}

          <div className="rounded-b-2xl rounded-tr-2xl border bg-white overflow-hidden">
            {/* Filters */}

            <div className="border-b p-5">
              {mainTab === 'vendor' ? (
                <VendorFilters
                  search={vendorSearch}
                  onSearchChange={setVendorSearch}
                  type={vendorType}
                  onTypeChange={setVendorType}
                  dateRange={vendorDateRange}
                  onDateRangeChange={setVendorDateRange}
                />
              ) : (
                <CustomerFilters
                  search={customerSearch}
                  onSearchChange={setCustomerSearch}
                  type={customerType}
                  onTypeChange={setCustomerType}
                  dateRange={customerDateRange}
                  onDateRangeChange={setCustomerDateRange}
                />
              )}
            </div>

            {/* Table */}

            <div className="border border-none bg-white p-8">
              <div className="bg-white border border-muted rounded-xl">
                {mainTab === 'vendor' ? (
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
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
