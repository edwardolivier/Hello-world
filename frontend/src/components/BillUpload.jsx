import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { billsApi } from '../api'

export default function BillUpload({ onUploaded }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setStatus('uploading')
    setError('')
    setResult(null)

    try {
      const res = await billsApi.upload(file)
      setResult(res.data)
      setStatus('done')
      onUploaded?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Make sure the PDF is a text-based electricity bill.')
      setStatus('error')
    }
  }, [onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: status === 'uploading'
  })

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Upload Electricity Bill</h3>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
          ${isDragActive ? 'border-blue-400 bg-blue-900/20' : 'border-slate-600 hover:border-slate-500'}
          ${status === 'uploading' ? 'opacity-50 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">
          {status === 'uploading' ? '⏳' : status === 'done' ? '✅' : '📄'}
        </div>
        {status === 'uploading' ? (
          <p className="text-blue-400">Reading bill with AI... this takes a few seconds</p>
        ) : isDragActive ? (
          <p className="text-blue-400">Drop it here!</p>
        ) : (
          <>
            <p className="text-slate-300">Drag & drop a PDF bill here</p>
            <p className="text-slate-500 text-sm mt-1">or click to select file</p>
          </>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-3 bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {status === 'done' && result && (
        <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <p className="text-green-400 font-medium mb-3">Bill extracted successfully!</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-400">Retailer</div>
            <div className="text-white font-medium">{result.retailer}</div>
            <div className="text-slate-400">Period</div>
            <div className="text-white">{result.billing_period_start} → {result.billing_period_end}</div>
            <div className="text-slate-400">Total Usage</div>
            <div className="text-white">{result.total_kwh} kWh</div>
            <div className="text-slate-400">Flat Rate</div>
            <div className="text-white">{result.peak_rate_cents} c/kWh</div>
            <div className="text-slate-400">Daily Supply</div>
            <div className="text-white">{result.daily_supply_charge_cents} c/day</div>
            <div className="text-slate-400">Total Amount</div>
            <div className="text-amber-400 font-bold">${result.total_amount_dollars?.toFixed(2)}</div>
          </div>
          <button
            className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            onClick={() => { setStatus('idle'); setResult(null) }}
          >
            Upload another bill
          </button>
        </div>
      )}
    </div>
  )
}
