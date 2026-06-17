import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const username = localStorage.getItem('username')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <nav className="glass border-b border-slate-700/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <span className="text-lg font-bold text-white">Energy Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">@{username}</span>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-white text-sm transition px-3 py-1.5 rounded-lg hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
