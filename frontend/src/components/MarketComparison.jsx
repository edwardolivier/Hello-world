import { useState } from 'react'
import { marketApi } from '../api'

export default function MarketComparison({ hasBills }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runComparison = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await marketApi.compare()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  const savingColor = (saving) => {
    if (saving > 200) return 'text-green-400'
    if (saving > 0) return 'text-emerald-400'
    return 'text-slate-400'
  }

  return (
    <div className="glass rounded-2xl p-6 glow-green">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Market Comparison (Brisbane SEQ)</h3>
        <button
          onClick={runComparison}
          disabled={loading || !hasBills}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {loading ? 'Analysing...' : data ? 'Refresh' : 'Check Market'}
        </button>
      </div>

      {!hasBills && (
        <p className="text-slate-500 text-sm">Upload at least one bill to enable market comparison</p>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
          <div className="animate-spin text-2xl">⚡</div>
          <span>Asking AI to analyse QLD electricity market...</span>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {data.max_annual_saving > 0 && (
            <div className="bg-green-900/30 border border-green-500/40 rounded-xl p-4">
              <p className="text-green-300 font-semibold text-lg">
                Potential saving: ${data.max_annual_saving?.toFixed(0)}/year
              </p>
              <p className="text-green-400/80 text-sm mt-1">by switching to {data.best_offer_retailer}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 pr-4">Retailer</th>
                  <th className="text-right pr-4">Rate (c/kWh)</th>
                  <th className="text-right pr-4">Supply (c/day)</th>
                  <th className="text-right pr-4">Est. Monthly</th>
                  <th className="text-right">Annual Saving</th>
                </tr>
              </thead>
              <tbody>
                {data.offers?.map((offer, i) => (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/40 transition">
                    <td className="py-3 pr-4">
                      <span className="text-white font-medium">{offer.retailer}</span>
                      {offer.retailer === data.best_offer_retailer && (
                        <span className="ml-2 text-xs bg-green-800/60 text-green-400 px-2 py-0.5 rounded-full">Best</span>
                      )}
                      {offer.retailer === data.current_retailer && (
                        <span className="ml-2 text-xs bg-blue-800/60 text-blue-400 px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </td>
                    <td className="text-right pr-4 text-slate-300">{offer.usage_rate_cents?.toFixed(2)}</td>
                    <td className="text-right pr-4 text-slate-300">{offer.daily_supply_cents?.toFixed(2)}</td>
                    <td className="text-right pr-4 text-slate-300">${offer.estimated_monthly_cost?.toFixed(0)}</td>
                    <td className={`text-right font-medium ${savingColor(offer.potential_annual_saving)}`}>
                      {offer.potential_annual_saving > 0 ? `$${offer.potential_annual_saving?.toFixed(0)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-slate-300 text-sm font-medium mb-1">Recommendation</p>
            <p className="text-slate-400 text-sm">{data.recommendation}</p>
          </div>

          <p className="text-slate-600 text-xs">{data.disclaimer}</p>
        </div>
      )}
    </div>
  )
}
