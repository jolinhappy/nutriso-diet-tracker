interface ProgressBarProps {
  label: string
  current: number
  goal: number
  unit: string
  colorClass: string
}

export default function ProgressBar({ label, current, goal, unit, colorClass }: ProgressBarProps) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const isOver = current > goal

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className={isOver ? 'text-error-500 font-medium' : 'text-gray-500'}>
          {Math.round(current)} / {goal} {unit}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-error-400' : colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
