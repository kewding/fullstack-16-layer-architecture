import React, { useCallback, useEffect, useState } from 'react';
import { VendorsTable } from './components/VendorsTable';
import { VENDORS_STATUS_TABLE_COLUMNS } from './constants/vendorsStatusTableColumns';
import { VENDORS_BALANCE_TABLE_COLUMNS } from './constants/vendorsBalanceTableColumns';
import { NavigationSection } from './components/NavigationSection';
import { Button } from '@/components/ui/button';
import {
  vendorService,
  type VendorReviewRow,
  type VendorBalanceRow,
  type VendorStatusFilter,
} from './services/vendor.service';

type TabType = 'review' | 'balance';

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

  // reset page when tab, search, or filter changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full h-full gap-4">
        <h1 className="text-2xl font-semibold">Vendors</h1>

        <NavigationSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Status filter — review tab only */}
        {activeTab === 'review' && (
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(f.value)}
                className="rounded-full"
              >
                {f.label}
              </Button>
            ))}
          </div>
        )}

        {activeTab === 'review' ? (
          <VendorsTable
            columns={VENDORS_STATUS_TABLE_COLUMNS}
            data={reviewData}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        ) : (
          <VendorsTable
            columns={VENDORS_BALANCE_TABLE_COLUMNS}
            data={balanceData}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        )}
      </main>
    </div>
  );
};