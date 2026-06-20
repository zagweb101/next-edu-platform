'use client';

import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DashboardChartProps {
  type: 'revenue' | 'users';
}

const REVENUE_DATA = [
  { day: '1', value: 1240 },
  { day: '5', value: 1820 },
  { day: '10', value: 1650 },
  { day: '15', value: 2480 },
  { day: '20', value: 2150 },
  { day: '25', value: 3120 },
  { day: '30', value: 3890 },
];

const USERS_DATA = [
  { day: '1', value: 12 },
  { day: '5', value: 24 },
  { day: '10', value: 31 },
  { day: '15', value: 45 },
  { day: '20', value: 52 },
  { day: '25', value: 68 },
  { day: '30', value: 84 },
];

const chartConfig = {
  revenue: { label: { ar: 'الإيرادات', en: 'Revenue' }, color: 'hsl(150, 60%, 40%)' },
  users: { label: { ar: 'المستخدمون', en: 'Users' }, color: 'hsl(220, 70%, 55%)' },
} as const;

export function DashboardChart({ type }: DashboardChartProps) {
  const locale = useLocale() as 'ar' | 'en';
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const data = type === 'revenue' ? REVENUE_DATA : USERS_DATA;
  const label = chartConfig[type].label[locale];
  const color = chartConfig[type].color;
  const gridColor = isDark ? '#27272a' : '#e4e4e7';
  const tickColor = isDark ? '#a1a1aa' : '#71717a';

  const formatY = useMemo(() => {
    return (v: number) => {
      if (type === 'revenue') {
        return locale === 'ar' ? `${v} ر.س` : `${v} SAR`;
      }
      return v.toString();
    };
  }, [type, locale]);

  return (
    <div className="w-full h-[260px]" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: tickColor }}
            stroke={gridColor}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: tickColor }}
            stroke={gridColor}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatY}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              fontSize: '13px',
              color: isDark ? '#fafafa' : '#18181b',
            }}
            labelStyle={{ color: tickColor }}
            formatter={(v: number) => [formatY(v), label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${type})`}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
