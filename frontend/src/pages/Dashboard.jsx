import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import UsageChart from '../components/UsageChart'
import DailyCostChart from '../components/DailyCostChart'
import BillUpload from '../components/BillUpload'
import BillsList from '../components/BillsList'
import MarketComparison from '../components/MarketComparison'
import { billsApi } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async () => {
    try {
      const [statsRes, billsRes] = await Promise.all([
        billsApi.stats(),
        billsApi.list()
      ])
      setStats(statsRes.data)
      setBills(billsRes.data)
    } catch (e) {
      console.error('Failed to load data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'bills', label: 'Bills' },
    { id: 'market', label: 'Market Compare' },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-pulse">⚡</div>
              <p>Loading your energy data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon="💰"
                label="Avg Daily Cost"
                value={stats?.avg_daily_cost ? `$${stats.avg_daily_cost.toFixed(2)}` : '—'}
                sub="per day average"
                glowClass="glow-amber"
                accent="text-amber-400"
              />
              <StatCard
                icon="⚡"
                label="Avg Daily Usage"
                value={stats?.avg_daily_kwh ? `${stats.avg_daily_kwh.toFixed(1)} kWh` : '—'}
                sub="per day average"
                glowClass="glow-blue"
                accent="text-blue-400"
              />
              <StatCard
                icon="📋"
                label="Current Rate"
                value={stats?.avg_peak_rate_cents ? `${stats.avg_peak_rate_cents.toFixed(2)} c` : '—'}
                sub={`per kWh · ${stats?.current_retailer || '—'}`}
                glowClass="glow-blue"
                accent="text-sky-400"
              />
              <StatCard
                icon="🧾"
                label="Total Spent"
                value={stats?.total_spent ? `$${stats.total_spent.toFixed(0)}` : '—'}
                sub={`across ${stats?.bills_count || 0} bill${stats?.bills_count !== 1 ? 's' : ''}`}
                glowClass="glow-amber"
                accent="text-amber-400"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition
                    ${activeTab === tab.id
                      ? 'text-white border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-slate-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {!stats?.bills_count && (
                  <div className="glass rounded-2xl p-8 text-center">
                    <div className="text-5xl mb-4">📄</div>
                    <h2 className="text-xl text-white font-semibold mb-2">Upload your first electricity bill</h2>
                    <p className="text-slate-400 text-sm">Go to the Bills tab to upload a PDF and start tracking</p>
                    <button
                      onClick={() => setActiveTab('bills')}
                      className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition"
                    >
                      Upload a Bill
                    </button>
                  </div>
                )}

                {stats?.bills_count > 0 && (
                  <>
                    <UsageChart data={stats?.monthly_data} />
                    <DailyCostChart data={stats?.monthly_data} />
                  </>
                )}
              </div>
            )}

            {activeTab === 'bills' && (
              <div className="space-y-6">
                <BillUpload onUploaded={loadData} />
                <BillsList bills={bills} onDeleted={loadData} />
              </div>
            )}

            {activeTab === 'market' && (
              <MarketComparison hasBills={stats?.bills_count > 0} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
