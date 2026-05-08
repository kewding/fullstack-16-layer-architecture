import { format } from 'date-fns';
import { useState } from 'react';
import type { FlexibleDateRange } from '../transactions/components/navigation-section/DatePicker';
import DateRangePicker from '../transactions/components/navigation-section/DatePicker';
import AllergenInterventionsTable from './components/AllergenInterventionsTable';
import NQSTrendChart from './components/NqsTrendChart';
import NutritionalTargetChart from './components/NutritionalGetChart';
import RevenueDistributionModal from './components/RevenueDistributionModal';
import StallSettlementTable from './components/StallSetllementTable';
import StatCards from './components/StatCards';
import { useDashboard } from './schema/UserDashboard';

// Default range: current month
function defaultRange(): FlexibleDateRange {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: now,
  };
}

export const AdminDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<FlexibleDateRange>(defaultRange);
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);

  const {
    statCards,
    nqsTrend,
    allergenInterventions,
    nutritionalTarget,
    stallSettlement,
    loading,
  } = useDashboard(dateRange);

  const dateFrom = dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined;
  const dateTo = dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Nutrition, allergen, and financial overview
          </p>
        </div>
        <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      {/* Row 1 — Stat Cards */}
      <StatCards
        data={statCards}
        loading={loading}
        onViewRevenue={() => setRevenueModalOpen(true)}
      />

      {/* Row 2 — NQS Trend + Allergen Table */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <NQSTrendChart data={nqsTrend} loading={loading} />
        <AllergenInterventionsTable data={allergenInterventions} loading={loading} />
      </div>

      {/* Row 3 — Nutritional Target + Stall Settlement */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <NutritionalTargetChart data={nutritionalTarget} loading={loading} />
        <StallSettlementTable data={stallSettlement} loading={loading} />
      </div>

      {/* Revenue Distribution Modal */}
      <RevenueDistributionModal
        open={revenueModalOpen}
        onClose={() => setRevenueModalOpen(false)}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
};
