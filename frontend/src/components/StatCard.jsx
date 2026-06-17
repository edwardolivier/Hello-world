export default function StatCard({ icon, label, value, sub, glowClass = 'glow-blue', accent = 'text-blue-400' }) {
  return (
    <div className={`glass rounded-2xl p-6 ${glowClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  )
}
