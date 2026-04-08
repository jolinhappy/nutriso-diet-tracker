import axios from 'axios'
import { getLineUserId } from './liff'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
})

apiClient.interceptors.request.use((config) => {
  const userId = getLineUserId()
  if (userId) {
    config.headers['x-line-userid'] = userId
  }
  return config
})

export default apiClient
