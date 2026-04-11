export function getTaipeiToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** 從 YYYY-MM-DD 字串往前/往後 offset 天，回傳新的 YYYY-MM-DD */
export function offsetDate(dateStr: string, offset: number): string {
  const d = new Date(`${dateStr}T00:00:00+08:00`)
  d.setDate(d.getDate() + offset)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** 將 YYYY-MM-DD 格式化為顯示文字（今日 / 昨天 / M/D） */
export function formatDateLabel(dateStr: string, today: string): string {
  if (dateStr === today) return '今日'
  const yesterday = offsetDate(today, -1)
  if (dateStr === yesterday) return '昨天'
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}
