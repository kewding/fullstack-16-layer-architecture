import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ShieldAlert, Wallet, Eye } from 'lucide-react';
import type { StatCardsData } from '../services/dashboard.service';

interface StatCardsProps {
  data: StatCardsData | null;
  loading: boolean;
  onViewRevenue: () => void;
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
      </CardContent>
    </Card>
  );
}

function nqsColor(score: number) {
  if (score >= 50)  return 'text-emerald-600';
  if (score >= 0)   return 'text-amber-500';
  return 'text-red-500';
}

export default function StatCards({ data, loading, onViewRevenue }: StatCardsProps) {
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* NQS Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Daily Nutritional Quality Score
          </CardTitle>
          <Activity className="size-5 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold tabular-nums ${nqsColor(data?.daily_nqs ?? 0)}`}>
            {data ? data.daily_nqs.toFixed(1) : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">NRF 9.3 avg across transactions</p>
        </CardContent>
      </Card>

      {/* Allergen Interventions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Daily Allergen Interventions
          </CardTitle>
          <ShieldAlert className="size-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums text-amber-600">
            {data ? data.daily_allergen_count : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">Blocked purchases in range</p>
        </CardContent>
      </Card>

      {/* Total Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Total Gross Sales
          </CardTitle>
          <Wallet className="size-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums text-blue-600">
            {data
              ? `₱${data.total_gross_sales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
              : '—'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-1.5 text-xs"
            onClick={onViewRevenue}
          >
            <Eye className="size-3.5" />
            View Distribution
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}