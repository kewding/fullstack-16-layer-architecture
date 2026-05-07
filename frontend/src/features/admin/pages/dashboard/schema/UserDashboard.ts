import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { FlexibleDateRange } from '../../transactions/components/navigation-section/DatePicker';
import { dashboardService, type AllergenInterventionsData, type NQSTrendData, type NutritionalTargetData, type StallSettlementData, type StatCardsData } from '../services/dashboard.service';

export interface DashboardState {
  statCards: StatCardsData | null;
  nqsTrend: NQSTrendData | null;
  allergenInterventions: AllergenInterventionsData | null;
  nutritionalTarget: NutritionalTargetData | null;
  stallSettlement: StallSettlementData | null;
  loading: boolean;
  error: string | null;
}

export function useDashboard(dateRange: FlexibleDateRange) {
  const [state, setState] = useState<DashboardState>({
    statCards: null,
    nqsTrend: null,
    allergenInterventions: null,
    nutritionalTarget: null,
    stallSettlement: null,
    loading: false,
    error: null,
  });

  const dateFrom = dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined;
  const dateTo   = dateRange.end   ? format(dateRange.end,   'yyyy-MM-dd') : undefined;

  const fetchAll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [statCards, nqsTrend, allergenInterventions, nutritionalTarget, stallSettlement] =
        await Promise.all([
          dashboardService.getStatCards(dateFrom, dateTo),
          dashboardService.getNQSTrend(),
          dashboardService.getAllergenInterventions(dateFrom, dateTo),
          dashboardService.getNutritionalTarget(dateFrom, dateTo),
          dashboardService.getStallSettlement(),
        ]);
      setState({
        statCards, nqsTrend, allergenInterventions,
        nutritionalTarget, stallSettlement,
        loading: false, error: null,
      });
    } catch (err: unknown) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard',
      }));
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { ...state, refetch: fetchAll };
}