import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-sm">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      <p className="text-amber-400">Avg daily cost: ${payload[0]?.value?.toFixed(2)}</p>
      <p className="text-blue-400">Avg daily usage: {payload[1]?.value?.toFixed(1)} kWh</p>
    </div>
  )
}

export default function DailyCostChart({ data }) {
  if (!data?.length) return (
    <div className="glass rounded-2xl p-6 flex items-center justify-center h-56 text-slate-500">
      No data yet
    </div>
  )

  return (
    <div className="glass rounded-2xl p-6 glow-amber">
      <h3 className="text-white font-semibold mb-4">Average Daily Cost Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="avg_daily_cost" stroke="#f59e0b" strokeWidth={2} fill="url(#costGrad)" />
          <Area type="monotone" dataKey="avg_daily_kwh" stroke="#3b82f6" strokeWidth={2} fill="url(#kwhGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
