// src/features/vendor/dashboard/index.tsx

import React, { useCallback, useEffect, useState } from 'react';
import type {
  AllergenCountResponse,
  AllergenInterventionRow,
  DailyProfitCard,
  TopRatedItem,
  TopSellingItem,
  WalletCard,
} from './schemas/dashboard.schema';
import { dashboardService } from './services/dashboard.service';

// ── helpers ───────────────────────────────────────────────────────────────────

const peso = (v: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half = !filled && i === Math.ceil(rating) && rating % 1 !== 0;
    stars.push(
      <span key={i} className="relative inline-block text-lg leading-none">
        <span className="text-[#e2c97e]/30">★</span>
        {(filled || half) && (
          <span
            className="absolute inset-0 overflow-hidden text-[#e2c97e]"
            style={{ width: half ? '50%' : '100%' }}
          >
            ★
          </span>
        )}
      </span>,
    );
  }
  return <span className="flex gap-0.5">{stars}</span>;
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#1e3a2f]/60 ${className}`}
    />
  );
}

// ── card shell ────────────────────────────────────────────────────────────────

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-[#2a4a3a]
        bg-gradient-to-br from-[#0f2318] to-[#0a1a10]
        p-6 shadow-xl shadow-black/40
        ${className}
      `}
    >
      {/* subtle corner accent */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#e2c97e]/5 blur-2xl" />
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#7aad8a]">
      {children}
    </p>
  );
}

// ── Daily Profit Card ─────────────────────────────────────────────────────────

function DailyProfitCardSection({ data }: { data: DailyProfitCard | null }) {
  const isPositive = data ? data.daily_net_profit >= 0 : true;

  return (
    <Card className="col-span-2 row-span-1">
      <CardLabel>Daily Net Profit</CardLabel>

      {!data ? (
        <>
          <Skeleton className="mb-4 h-12 w-48" />
          <div className="flex gap-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </>
      ) : (
        <>
          {/* Big figure */}
          <p
            className={`
              mb-1 font-['DM_Mono',monospace] text-4xl font-bold tracking-tight
              ${isPositive ? 'text-[#7ee8a2]' : 'text-[#e87e7e]'}
            `}
          >
            {peso(data.daily_net_profit)}
          </p>
          <p className="mb-5 text-xs text-[#5a8a6a]">
            {new Date(data.date).toLocaleDateString('en-PH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {/* Sub-metrics */}
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl border border-[#2a4a3a] bg-[#112a1a] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-[#7aad8a]">
                Gross Sales Today
              </p>
              <p className="mt-0.5 font-['DM_Mono',monospace] text-xl font-semibold text-white">
                {peso(data.daily_gross_profit)}
              </p>
            </div>

            <div className="rounded-xl border border-[#2a4a3a] bg-[#112a1a] px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-[#7aad8a]">
                Daily Fee (Prorated)
              </p>
              <p className="mt-0.5 font-['DM_Mono',monospace] text-xl font-semibold text-[#e2c97e]">
                − {peso(data.prorated_daily_fee)}
              </p>
              <p className="mt-0.5 text-[10px] text-[#5a8a6a]">
                {peso(data.monthly_fee_total)} ÷ {data.business_days_in_month} biz days
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ── Wallet Card ───────────────────────────────────────────────────────────────

function WalletCardSection({ data }: { data: WalletCard | null }) {
  return (
    <Card>
      <CardLabel>Wallet Balance</CardLabel>
      {!data ? (
        <Skeleton className="h-12 w-36" />
      ) : (
        <>
          <p className="font-['DM_Mono',monospace] text-4xl font-bold text-white">
            {peso(data.balance)}
          </p>
          <p className="mt-2 text-xs text-[#5a8a6a]">Available to withdraw</p>
          {/* decorative coin icon */}
          <div className="absolute bottom-4 right-4 text-5xl opacity-10 select-none">₱</div>
        </>
      )}
    </Card>
  );
}

// ── Top Selling ───────────────────────────────────────────────────────────────

function TopSellingSection({ items }: { items: TopSellingItem[] | null }) {
  return (
    <Card>
      <CardLabel>Top Selling Items</CardLabel>
      <p className="mb-4 text-xs text-[#5a8a6a]">By total quantity sold</p>

      {!items ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#5a8a6a]">No sales data yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <li
              key={item.product_id}
              className="flex items-center gap-3 rounded-xl border border-[#2a4a3a] bg-[#112a1a] px-3 py-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e2c97e]/10 text-[10px] font-bold text-[#e2c97e]">
                {idx + 1}
              </span>
              <span className="flex-1 truncate text-sm text-white">{item.product_name}</span>
              <span className="shrink-0 font-['DM_Mono',monospace] text-xs text-[#7aad8a]">
                {item.total_qty.toLocaleString()} sold
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ── Top Rated ─────────────────────────────────────────────────────────────────

function TopRatedSection({ items }: { items: TopRatedItem[] | null }) {
  return (
    <Card>
      <CardLabel>Top Rated Items</CardLabel>
      <p className="mb-4 text-xs text-[#5a8a6a]">By average customer rating</p>

      {!items ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[#5a8a6a]">No ratings yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <li
              key={item.product_id}
              className="flex items-center gap-3 rounded-xl border border-[#2a4a3a] bg-[#112a1a] px-3 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e2c97e]/10 text-xs font-bold text-[#e2c97e]">
                {idx + 1}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-sm font-medium text-white">{item.product_name}</span>
                <div className="flex items-center gap-2">
                  <StarRating rating={item.avg_rating} />
                  <span className="font-['DM_Mono',monospace] text-xs text-[#e2c97e]">
                    {item.avg_rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[#5a8a6a]">
                    ({item.rating_count} {item.rating_count === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ── Allergen Count ────────────────────────────────────────────────────────────

function AllergenCountSection({ data }: { data: AllergenCountResponse | null }) {
  return (
    <Card>
      <CardLabel>Allergen Interventions</CardLabel>
      <p className="mb-1 text-xs text-[#5a8a6a]">Blocked purchases — last 7 days</p>

      {!data ? (
        <Skeleton className="mt-2 h-16 w-24" />
      ) : (
        <>
          <p
            className={`
              mt-2 font-['DM_Mono',monospace] text-5xl font-bold
              ${data.count === 0 ? 'text-[#7ee8a2]' : data.count < 5 ? 'text-[#e2c97e]' : 'text-[#e87e7e]'}
            `}
          >
            {data.count}
          </p>
          <p className="mt-1 text-[10px] text-[#5a8a6a]">
            Since {fmtDate(data.since)}
          </p>
          {/* visual alert badge */}
          {data.count > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#e87e7e]/30 bg-[#e87e7e]/10 px-3 py-1 text-[11px] font-medium text-[#e87e7e]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e87e7e]" />
              {data.count} blocked {data.count === 1 ? 'attempt' : 'attempts'}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ── Allergen Table ────────────────────────────────────────────────────────────

function AllergenTableSection({ rows }: { rows: AllergenInterventionRow[] | null }) {
  return (
    <Card className="col-span-2">
      <CardLabel>Recent Allergen Interventions</CardLabel>
      <p className="mb-4 text-xs text-[#5a8a6a]">
        Blocked purchase attempts at your stall — last 7 days
      </p>

      {!rows ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <span className="text-4xl">✓</span>
          <p className="text-sm font-medium text-[#7ee8a2]">No allergen interventions</p>
          <p className="text-xs text-[#5a8a6a]">No blocked purchases in the last 7 days.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a4a3a] text-[10px] uppercase tracking-widest text-[#7aad8a]">
                <th className="pb-2 text-left">Time</th>
                <th className="pb-2 text-left">Product</th>
                <th className="pb-2 text-left">Allergen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[#1a3325]/60 transition-colors hover:bg-[#112a1a]"
                >
                  <td className="py-2.5 pr-4 font-['DM_Mono',monospace] text-xs text-[#5a8a6a] whitespace-nowrap">
                    <span className="block">{fmtDate(row.time)}</span>
                    <span className="block">{fmtTime(row.time)}</span>
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-white">{row.product_name}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center rounded-full border border-[#e87e7e]/30 bg-[#e87e7e]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#e87e7e]">
                      {row.allergen}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const VendorDashboardPage: React.FC = () => {
  const [profitData, setProfitData] = useState<DailyProfitCard | null>(null);
  const [walletData, setWalletData] = useState<WalletCard | null>(null);
  const [topSelling, setTopSelling] = useState<TopSellingItem[] | null>(null);
  const [topRated, setTopRated] = useState<TopRatedItem[] | null>(null);
  const [allergenCount, setAllergenCount] = useState<AllergenCountResponse | null>(null);
  const [allergenRows, setAllergenRows] = useState<AllergenInterventionRow[] | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled([
      dashboardService.getDailyProfit(),
      dashboardService.getWallet(),
      dashboardService.getTopSelling(),
      dashboardService.getTopRated(),
      dashboardService.getAllergenCount(),
      dashboardService.getAllergenTable(),
    ]);

    if (results[0].status === 'fulfilled') setProfitData(results[0].value);
    if (results[1].status === 'fulfilled') setWalletData(results[1].value);
    if (results[2].status === 'fulfilled') setTopSelling(results[2].value.items);
    if (results[3].status === 'fulfilled') setTopRated(results[3].value.items);
    if (results[4].status === 'fulfilled') setAllergenCount(results[4].value);
    if (results[5].status === 'fulfilled') setAllergenRows(results[5].value.data);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div
      className="min-h-screen w-full px-4 py-8 md:px-8"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Google font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
      `}</style>

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#5a8a6a]">
            Your stall's performance at a glance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-[#5a8a6a]">
            Updated{' '}
            {lastRefresh.toLocaleTimeString('en-PH', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
          <button
            onClick={fetchAll}
            className="
              flex items-center gap-1.5 rounded-xl border border-[#2a4a3a]
              bg-[#112a1a] px-3 py-1.5 text-xs font-medium text-[#7aad8a]
              transition-colors hover:border-[#7aad8a] hover:text-white
            "
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Row 1: Daily Profit (wide) + Wallet */}
        <div className="md:col-span-2 xl:col-span-2">
          <DailyProfitCardSection data={profitData} />
        </div>
        <WalletCardSection data={walletData} />

        {/* Row 2: Top Selling + Top Rated + Allergen Count */}
        <TopSellingSection items={topSelling} />
        <TopRatedSection items={topRated} />
        <AllergenCountSection data={allergenCount} />

        {/* Row 3: Allergen Table (full width) */}
        <div className="md:col-span-2 xl:col-span-3">
          <AllergenTableSection rows={allergenRows} />
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardPage;