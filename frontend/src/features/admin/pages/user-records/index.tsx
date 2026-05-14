import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import CustomerDetailModal from './components/CustomerDetailModal';
import NavigationSection from './components/navigation-section';

import type { FlexibleDateRange } from './components/navigation-section/DateFilter';
import type { UserTab } from './components/navigation-section/TabFIlter';

import ActiveTable from './components/tables/ActiveTable';
import InactiveTable from './components/tables/InactiveTable';

import type { CustomerRow } from './services/customer.service';

const DEBOUNCE_MS = 350;

export default function UserRecordPage() {
  const [tab, setTab] = useState<UserTab>('active');

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Date Range
  const [dateRange, setDateRange] = useState<FlexibleDateRange>({
    start: null,
    end: null,
  });

  // Modal
  const [selectedUserID, setSelectedUserID] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleView = (user: CustomerRow) => {
    setSelectedUserID(user.user_id);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedUserID(null);
  };

  const handleTabChange = (newTab: UserTab) => {
    setTab(newTab);

    setSearchInput('');
    setDebouncedSearch('');

    setDateRange({
      start: null,
      end: null,
    });
  };

  return (
    <div className="w-full px-1">
      <main className="flex flex-col gap-5">

        {/* Header */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold tracking-tight">
              User Records
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage customer accounts, review profiles, and control account access.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="inline-flex items-center rounded-full bg-[#cd9a34] px-3 py-1 text-xs font-semibold text-white">
              {tab === 'active' ? 'Active Users' : 'Inactive Users'}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Connected Tabs + Surface */}

        <div className="flex flex-col gap-0">

          {/* Tabs */}

          <div className="flex items-end gap-1">

            <button
              onClick={() => handleTabChange('active')}
              className={`
                relative rounded-t-xl rounded-b-none
                px-5 py-2.5
                text-sm font-medium
                transition-colors

                ${
                  tab === 'active'
                    ? `
                      z-10
                      bg-white
                      text-foreground
                    `
                    : `
                      bg-muted/40
                      text-muted-foreground
                      hover:text-foreground
                    `
                }
              `}
            >
              Active Users
            </button>

            <button
              onClick={() => handleTabChange('inactive')}
              className={`
                relative rounded-t-xl rounded-b-none
                px-5 py-2.5
                text-sm font-medium
                transition-colors

                ${
                  tab === 'inactive'
                    ? `
                      z-10
                      bg-white
                      text-foreground
                    `
                    : `
                      bg-muted/40
                      text-muted-foreground
                      hover:text-foreground
                    `
                }
              `}
            >
              Inactive Users
            </button>
          </div>

          {/* Surface */}

          <div className="overflow-hidden rounded-b-2xl rounded-tr-2xl border bg-white">

            {/* Filters */}

            <div className="border-b p-5">
              <NavigationSection
                tab={tab}
                onTabChange={handleTabChange}
                search={searchInput}
                onSearchChange={handleSearchChange}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            {/* Table */}

            <div className="bg-white p-8">
              <div className="overflow-hidden rounded-xl border border-muted bg-white">

                {tab === 'active' ? (
                  <ActiveTable
                    search={debouncedSearch}
                    dateRange={dateRange}
                    onView={handleView}
                  />
                ) : (
                  <InactiveTable
                    search={debouncedSearch}
                    dateRange={dateRange}
                    onView={handleView}
                    onReactivateSuccess={() => setTab('active')}
                  />
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Modal */}

        <CustomerDetailModal
          userID={selectedUserID}
          open={modalOpen}
          onClose={handleModalClose}
        />
      </main>
    </div>
  );
}