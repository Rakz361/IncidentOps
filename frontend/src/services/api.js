import axios from 'axios'

const apiBaseURL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '')

const API = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default API