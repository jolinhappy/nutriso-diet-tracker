import { useEffect, useState } from 'react'
import { initLiff } from './lib/liff'
import Layout from './components/Layout'

type LiffState = 'initializing' | 'ready' | 'error'

export default function App() {
  const [liffState, setLiffState] = useState<LiffState>('initializing')
  const [liffError, setLiffError] = useState('')

  useEffect(() => {
    initLiff()
      .then(() => setLiffState('ready'))
      .catch((err: unknown) => {
        if (err instanceof Error && err.message.startsWith('Redirecting')) return
        console.error('LIFF init error:', err)
        setLiffError(String(err))
        setLiffState('error')
      })
  }, [])

  if (liffState === 'initializing') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">載入中...</p>
        </div>
      </div>
    )
  }

  if (liffState === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <p className="text-error-500 text-sm">初始化失敗</p>
          <p className="text-gray-400 text-xs mt-1">{liffError}</p>
        </div>
      </div>
    )
  }

  return <Layout />
}
