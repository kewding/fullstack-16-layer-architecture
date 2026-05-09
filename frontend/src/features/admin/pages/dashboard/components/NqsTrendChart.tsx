import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NQSTrendData } from '../services/dashboard.service';

const NQS_TARGET = 45;

interface NQSTrendChartProps {
  data: NQSTrendData | null;
  loading: boolean;
}

export default function NQSTrendChart({ data, loading }: NQSTrendChartProps) {
  const chartData = (data?.points ?? []).map((p) => ({
    day: format(parseISO(p.date), 'EEE'),
    score: parseFloat(p.score.toFixed(1)),
  }));

  const hasData = chartData.some((p) => p.score !== 0);

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          Nutritional Quality Score Trend
        </CardTitle>
        <p className="text-xs text-gray-400">Current week Mon–Fri · NRF 9.3</p>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="h-52 animate-pulse rounded bg-gray-100" />
        ) : !hasData ? (
          <div className="flex h-52 items-center justify-center text-sm text-gray-400">
            No transaction data for this week yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [v.toFixed(1), 'NQS Score']}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine
                y={NQS_TARGET}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: `Target ${NQS_TARGET}`,
                  fontSize: 11,
                  fill: '#f59e0b',
                  position: 'right',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="NQS Score"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
