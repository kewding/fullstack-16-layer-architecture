// AdminVendorsPage.tsx
import { Button } from '@/components/ui/button';
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
    <div className="w-full px-6 py-6">
      <main className="flex flex-col gap-6">
        {/* Header */}
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Vendors
          </h1>

          <p className="text-sm text-muted-foreground max-w-2xl">
            Manage onboarding vendors, active business stalls, removals,
            and operational records.
          </p>
        </section>

        {/* Navigation Card */}
        <section className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm">
          <div className="p-5">
            <NavigationSection
              activeTab={activeTab}
              onTabChange={setActiveTab}
              search={search}
              onSearchChange={setSearch}
              onInvited={fetchData}
            />
          </div>
        </section>

        {/* Filters */}
        {activeTab === 'review' && (
          <section className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value;

              return (
                <Button
                  key={f.value}
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(f.value)}
                  className={`
                    h-9 rounded-xl px-4 transition-all
                    ${
                      active
                        ? 'bg-[#3F6F64] text-white hover:bg-[#345d54]'
                        : 'border-border hover:border-[#3F6F64]/40 hover:bg-[#3F6F64]/5'
                    }
                  `}
                >
                  {f.label}
                </Button>
              );
            })}
          </section>
        )}

        {/* Content */}
        <section className="flex flex-col gap-6">
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
            <>
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
            </>
          )}
        </section>
      </main>
    </div>
  );
};