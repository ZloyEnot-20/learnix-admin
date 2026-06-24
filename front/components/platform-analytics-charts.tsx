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
  tickInterval?: number
}

function formatTick(date: string) {
  return date.slice(5)
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
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{label}</p>
      <p className="mt-1 font-semibold tabular-nums" style={{ color }}>
        {payload[0]?.value?.toLocaleString("ru-RU") ?? 0}
      </p>
    </div>
  )
}

export function AnalyticsAreaChart({
  data,
  color,
  fillId,
  height = 280,
  tickInterval,
}: AnalyticsAreaChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const yMax = Math.ceil(max * 1.15) || 1

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#3f3f46" }}
            tickFormatter={formatTick}
            interval={tickInterval ?? "preserveStartEnd"}
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={[0, yMax]}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip color={color} />}
            cursor={{ stroke: "#52525b", strokeWidth: 1 }}
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
            activeDot={{ r: 4, fill: color, stroke: "#18181b", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
