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

  // ── Search with debounce ──────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  // ── Date range ────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<FlexibleDateRange>({
    start: null,
    end: null,
  });

  // Reset filters when switching tabs
  const handleTabChange = (newTab: UserTab) => {
    setTab(newTab);
    setSearchInput('');
    setDebouncedSearch('');
    setDateRange({ start: null, end: null });
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
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

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full gap-6">
        {/* Header */}
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">User Records</h1>

          <p className="text-sm text-muted-foreground">
            Manage customer accounts — view, disable, or reactivate.
          </p>
        </section>

        {/* Navigation */}
        <section className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm">
          <div className="px-5 py-4">
            <NavigationSection
              tab={tab}
              onTabChange={handleTabChange}
              search={searchInput}
              onSearchChange={handleSearchChange}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </section>

        {/* Table */}
        <section>
          {tab === 'active' ? (
            <ActiveTable search={debouncedSearch} dateRange={dateRange} onView={handleView} />
          ) : (
            <InactiveTable
              search={debouncedSearch}
              dateRange={dateRange}
              onView={handleView}
              onReactivateSuccess={() => setTab('active')}
            />
          )}
        </section>

        {/* Modal */}
        <CustomerDetailModal userID={selectedUserID} open={modalOpen} onClose={handleModalClose} />
      </main>
    </div>
  );
}
