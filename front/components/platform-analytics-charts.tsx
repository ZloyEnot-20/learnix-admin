"use client"

import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface DayPoint {
  date: string
  count: number
}

interface AnalyticsAreaChartProps {
  data: DayPoint[]
  color: string
  fillId: string
  height?: number
}

function formatTick(date: string) {
  const [, month, day] = date.split("-")
  return `${month}/${day}`
}

function ChartTooltip({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string
  color: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
        <span style={{ color }}>{payload[0]?.value?.toLocaleString("en-US") ?? 0}</span>
      </p>
    </div>
  )
}

export function AnalyticsAreaChart({
  data,
  color,
  fillId,
  height = 260,
}: AnalyticsAreaChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const yMax = Math.ceil(max * 1.12) || 1

  return (
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            tickFormatter={formatTick}
            interval="preserveStartEnd"
            minTickGap={32}
            dy={6}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={[0, yMax]}
            allowDecimals={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            content={<ChartTooltip color={color} />}
            cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="none"
            fill={`url(#${fillId})`}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
