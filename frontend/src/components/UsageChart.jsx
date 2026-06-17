import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-sm">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name.includes('Cost') || p.name.includes('cost') ? `$${p.value?.toFixed(2)}` : `${p.value?.toFixed(1)} kWh`}
        </p>
      ))}
    </div>
  )
}

export default function UsageChart({ data }) {
  if (!data?.length) return (
    <div className="glass rounded-2xl p-6 flex items-center justify-center h-64 text-slate-500">
      Upload bills to see your usage history
    </div>
  )

  return (
    <div className="glass rounded-2xl p-6 glow-blue">
      <h3 className="text-white font-semibold mb-4">Usage & Cost History</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis yAxisId="kwh" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis yAxisId="cost" orientation="right" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Bar yAxisId="kwh" dataKey="kwh" name="Usage (kWh)" fill="#3b82f6" opacity={0.8} radius={[4, 4, 0, 0]} />
          <Line yAxisId="cost" type="monotone" dataKey="cost" name="Total Cost ($)" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
