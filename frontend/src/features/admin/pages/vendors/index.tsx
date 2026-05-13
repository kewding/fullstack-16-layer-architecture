// AdminVendorsPage.tsx
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useCallback, useEffect, useState } from 'react';

import { FormerVendorsTable } from './components/FormerVendorsTable';
import { NavigationSection } from './components/NavigationSection';
import { VendorsTable } from './components/VendorsTable';

import { VENDORS_BALANCE_TABLE_COLUMNS } from './constants/vendorsBalanceTableColumns';
import { VENDORS_STATUS_TABLE_COLUMNS } from './constants/vendorsStatusTableColumns';

import {
  vendorService,
  type VendorBalanceRow,
  type VendorReviewRow,
  type VendorStatusFilter,
} from './services/vendor.service';

type TabType = 'review' | 'stalls';

const STATUS_FILTERS: { label: string; value: VendorStatusFilter }[] = [
  { label: 'All', value: '' },
  { label: 'Invited', value: 'invited' },
  { label: 'For Review', value: 'for_review' },
  { label: 'In Business', value: 'in_business' },
];

export const AdminVendorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('review');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VendorStatusFilter>('');
  const [page, setPage] = useState(1);

  const [reviewData, setReviewData] = useState<VendorReviewRow[]>([]);
  const [balanceData, setBalanceData] = useState<VendorBalanceRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      if (activeTab === 'review') {
        const res = await vendorService.listReview(page, search, statusFilter);

        setReviewData(res.data);
        setTotalPages(res.total_pages);
        setTotal(res.total);
      } else {
        const res = await vendorService.listBalance(page, search);

        setBalanceData(res.data);
        setTotalPages(res.total_pages);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="w-full px-1">
      <main className="flex flex-col gap-5">
        {/* ───────────────── Header ───────────────── */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage onboarding vendors, active business stalls, removals, and operational records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full bg-[#cd9a34] px-3 py-1 text-xs font-semibold text-white">
              {total.toLocaleString()} total
            </div>
          </div>
        </div>

        {/* ───────────────── Connected Tabs + Content ───────────────── */}

        <div className="flex flex-col gap-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="h-auto justify-start gap-1 bg-transparent p-0">
              <TabsTrigger
                value="review"
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
                Onboarding
              </TabsTrigger>

              <TabsTrigger
                value="stalls"
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
                Active Vendors
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ───────────────── Connected Surface ───────────────── */}

          <div className="rounded-b-2xl rounded-tr-2xl border bg-white overflow-hidden">
            {/* Navigation Section (always visible) */}
            <div className="border-b p-5">
              <NavigationSection
                activeTab={activeTab}
                onTabChange={setActiveTab}
                search={search}
                onSearchChange={setSearch}
                onInvited={fetchData}
              />
            </div>

            {/* Extra Status Filter Row (Review Only) */}
            {activeTab === 'review' && (
              <div className="border-b px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((f) => {
                    const active = statusFilter === f.value;

                    return (
                      <Button
                        key={f.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusFilter(f.value)}
                        className={`
                h-9 rounded-lg px-4 text-sm font-medium transition-colors
                ${
                  active
                    ? 'border-[#CD9A34]/40 bg-[#CD9A34]/10 text-[#CD9A34]'
                    : 'border-border bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }
              `}
                      >
                        {f.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tables */}
            <div className="border border-none bg-white p-8">
              <div className="rounded-xl border border-muted bg-white">
                {activeTab === 'review' ? (
                  <VendorsTable
                    columns={VENDORS_STATUS_TABLE_COLUMNS(fetchData, fetchData)}
                    data={reviewData}
                    isLoading={isLoading}
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                  />
                ) : (
                  <div className="flex flex-col gap-6">
                    <VendorsTable
                      columns={VENDORS_BALANCE_TABLE_COLUMNS(fetchData)}
                      data={balanceData}
                      isLoading={isLoading}
                      page={page}
                      totalPages={totalPages}
                      total={total}
                      onPageChange={setPage}
                    />

                    <div className="h-px bg-border/70" />

                    <FormerVendorsTable />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
