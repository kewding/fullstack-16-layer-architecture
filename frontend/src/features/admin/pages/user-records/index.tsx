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
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">User Records</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage customer accounts — view, disable, or reactivate.
        </p>
      </div>

      {/* Navigation: tabs + search + date range */}
      <NavigationSection
        tab={tab}
        onTabChange={handleTabChange}
        search={searchInput}
        onSearchChange={handleSearchChange}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Table */}
      {tab === 'active' ? (
        <ActiveTable search={debouncedSearch} dateRange={dateRange} onView={handleView} />
      ) : (
        <InactiveTable
          search={debouncedSearch}
          dateRange={dateRange}
          onView={handleView}
          // When a reactivation succeeds from the inactive table,
          // we optionally switch the user back to the Active tab.
          onReactivateSuccess={() => setTab('active')}
        />
      )}

      {/* Detail modal */}
      <CustomerDetailModal userID={selectedUserID} open={modalOpen} onClose={handleModalClose} />
    </div>
  );
}
