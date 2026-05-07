import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import type { NutritionalTargetData } from '../services/dashboard.service';

interface NutritionalTargetChartProps {
  data: NutritionalTargetData | null;
  loading: boolean;
}

// For diverging: encouraged bars go right (positive), limited bars go left (negative)
function transformData(data: NutritionalTargetData) {
  return data.nutrients.map((n) => ({
    nutrient: n.nutrient,
    // limited nutrients shown as negative so they diverge left
    value: n.is_limited ? -Math.abs(n.percent_dv) : Math.abs(n.percent_dv),
    isLimited: n.is_limited,
    rawPct: n.percent_dv,
  }));
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow text-xs">
      <p className="font-semibold text-gray-800">{d.nutrient}</p>
      <p className={d.isLimited ? 'text-red-500' : 'text-emerald-600'}>
        {d.rawPct.toFixed(1)}% DV {d.isLimited ? '(limit)' : '(encouraged)'}
      </p>
    </div>
  );
};

export default function NutritionalTargetChart({ data, loading }: NutritionalTargetChartProps) {
  const chartData = data ? transformData(data) : [];

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          Nutritional Target Status
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500" /> Encouraged
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-red-400" /> Limited
          </span>
          <span>% Daily Value</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="h-72 animate-pulse rounded bg-gray-100" />
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 40, left: 80, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${Math.abs(v)}%`}
                domain={[-110, 110]}
              />
              <YAxis
                type="category"
                dataKey="nutrient"
                tick={{ fontSize: 11 }}
                width={76}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#d1d5db" />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={18}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isLimited ? '#f87171' : '#10b981'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}