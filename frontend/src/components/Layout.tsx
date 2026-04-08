import { useState } from 'react'
import TodayPage from '../pages/TodayPage'
import HistoryPage from '../pages/HistoryPage'
import SettingsPage from '../pages/SettingsPage'

type Tab = 'today' | 'history' | 'settings'

function TodayIcon({ active }: { active: boolean }) {
  const c = active ? '#17B8D4' : '#A1A1A1'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8"/>
      <path d="M3 10h18" stroke={c} strokeWidth="1.8"/>
      <path d="M8 3v4M16 3v4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="7" y="13" width="3" height="2.5" rx="0.5" fill={c}/>
      <rect x="14" y="13" width="3" height="2.5" rx="0.5" fill={c}/>
    </svg>
  )
}

function HistoryIcon({ active }: { active: boolean }) {
  const c = active ? '#17B8D4' : '#A1A1A1'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="12" width="4" height="8" rx="1" fill={c}/>
      <rect x="10" y="8" width="4" height="12" rx="1" fill={c}/>
      <rect x="16" y="4" width="4" height="16" rx="1" fill={c}/>
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  const c = active ? '#17B8D4' : '#A1A1A1'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8"/>
      <path
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={c} strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  )
}

const TABS: { id: Tab; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'today', label: '今日', Icon: TodayIcon },
  { id: 'history', label: '歷史', Icon: HistoryIcon },
  { id: 'settings', label: '設定', Icon: SettingsIcon },
]

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('today')

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'today' && <TodayPage />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 flex safe-bottom">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5"
            >
              <Icon active={active} />
              <span
                className="text-xs"
                style={{ color: active ? '#17B8D4' : '#A1A1A1' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
