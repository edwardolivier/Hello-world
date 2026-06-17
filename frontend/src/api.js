import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

export const billsApi = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/bills/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  list: () => api.get('/bills/'),
  stats: () => api.get('/bills/stats'),
  delete: (id) => api.delete(`/bills/${id}`),
}

export const marketApi = {
  compare: () => api.get('/market/compare'),
}

export default api
