import { useState } from 'react'
import { billsApi } from '../api'

const Arrow = ({ current, previous }) => {
  if (previous == null || current == null) return null
  if (current === previous) return null
  const up = current > previous
  return (
    <span className={`ml-1 text-xs font-bold ${up ? 'text-red-400' : 'text-green-400'}`}>
      {up ? '▲' : '▼'}
    </span>
  )
}

const Cell = ({ value, prev, unit = '', fallback = '—' }) => (
  <td className="px-3 py-3 text-sm text-slate-300 whitespace-nowrap">
    {value != null
      ? <>{value}{unit}<Arrow current={value} previous={prev} /></>
      : <span className="text-slate-600">{fallback}</span>
    }
  </td>
)

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

  // bills are newest-first from API; prev bill for each row is the next index (older)
  const prev = (i, field) => bills[i + 1]?.[field] ?? null

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Bill History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700 text-xs">
              <th className="px-3 py-2 font-medium">Retailer</th>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium">Total kWh</th>
              <th className="px-3 py-2 font-medium">CL2 Usage</th>
              <th className="px-3 py-2 font-medium">Unit Cost</th>
              <th className="px-3 py-2 font-medium">CL2 Unit Cost</th>
              <th className="px-3 py-2 font-medium">Daily Supply</th>
              <th className="px-3 py-2 font-medium">Daily Supply CL</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill, i) => (
              <tr key={bill.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition">
                <td className="px-3 py-3">
                  <span className="text-white font-medium">{bill.retailer}</span>
                </td>
                <td className="px-3 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {bill.billing_period_start}<br />{bill.billing_period_end}
                </td>
                <Cell value={bill.total_kwh} prev={prev(i, 'total_kwh')} unit=" kWh" />
                <Cell value={bill.controlled_load_2_kwh} prev={prev(i, 'controlled_load_2_kwh')} unit=" kWh" />
                <Cell value={bill.peak_rate_cents} prev={prev(i, 'peak_rate_cents')} unit=" c/kWh" />
                <Cell value={bill.controlled_load_rate_cents} prev={prev(i, 'controlled_load_rate_cents')} unit=" c/kWh" />
                <Cell value={bill.daily_supply_charge_cents} prev={prev(i, 'daily_supply_charge_cents')} unit=" c/day" />
                <Cell value={bill.daily_supply_controlled_cents} prev={prev(i, 'daily_supply_controlled_cents')} unit=" c/day" />
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-amber-400 font-bold">${bill.total_amount_dollars?.toFixed(2)}</span>
                  <Arrow current={bill.total_amount_dollars} previous={prev(i, 'total_amount_dollars')} />
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => handleDelete(bill.id)}
                    disabled={deleting === bill.id}
                    className="text-slate-600 hover:text-red-400 transition text-lg disabled:opacity-30"
                    title="Delete bill"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-slate-600 text-xs mt-3">▲ red = increased from previous bill &nbsp;·&nbsp; ▼ green = decreased</p>
    </div>
  )
}
