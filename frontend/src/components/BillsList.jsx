import { useState } from 'react'
import { billsApi } from '../api'

export default function BillsList({ bills, onDeleted }) {
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (id) => {
    if (!confirm('Delete this bill?')) return
    setDeleting(id)
    try {
      await billsApi.delete(id)
      onDeleted?.()
    } catch (e) {
      alert('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  if (!bills?.length) return (
    <div className="glass rounded-2xl p-6 text-center text-slate-500">
      No bills uploaded yet
    </div>
  )

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Bill History</h3>
      <div className="space-y-3">
        {bills.map(bill => (
          <div key={bill.id} className="bg-slate-800/60 rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-white font-medium">{bill.retailer}</span>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                  {bill.billing_period_start} → {bill.billing_period_end}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-slate-400">
                <span>{bill.total_kwh} kWh</span>
                <span>{bill.peak_rate_cents} c/kWh</span>
                <span>{bill.daily_supply_charge_cents} c/day supply</span>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <span className="text-amber-400 font-bold">${bill.total_amount_dollars?.toFixed(2)}</span>
              <button
                onClick={() => handleDelete(bill.id)}
                disabled={deleting === bill.id}
                className="text-slate-600 hover:text-red-400 transition text-lg disabled:opacity-30"
                title="Delete bill"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
