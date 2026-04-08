import { useState } from 'react'
import { Meal } from '../hooks/useTodayMeals'
import { useEditMeal, useDeleteMeal, EditMealPayload } from '../hooks/useMealMutations'

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '點心', '宵夜'] as const

interface MealItemProps {
  meal: Meal
  date: string
}

export default function MealItem({ meal, date }: MealItemProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    mealType: meal.mealType,
    totalCalories: meal.totalCalories,
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
  })

  const editMeal = useEditMeal(date)
  const deleteMeal = useDeleteMeal(date)

  function handleEdit() {
    setForm({
      mealType: meal.mealType,
      totalCalories: meal.totalCalories,
      totalProtein: meal.totalProtein,
      totalCarbs: meal.totalCarbs,
      totalFat: meal.totalFat,
    })
    setEditing(true)
  }

  async function handleSave() {
    const payload: EditMealPayload = {
      mealType: form.mealType,
      items: meal.items,
      totalCalories: Number(form.totalCalories),
      totalProtein: Number(form.totalProtein),
      totalCarbs: Number(form.totalCarbs),
      totalFat: Number(form.totalFat),
    }
    await editMeal.mutateAsync({ mealId: meal.id, data: payload })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`確定刪除這筆${meal.mealType}紀錄？`)) return
    deleteMeal.mutate(meal.id)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-50">
        <div className="flex items-center gap-2">
          <span className="text-primary-700 font-semibold text-sm">{meal.mealType}</span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-gray-500 text-xs">{Math.round(meal.totalCalories)} kcal</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="text-xs text-primary-600 border border-primary-300 rounded-full px-2.5 py-0.5 hover:bg-primary-50 active:bg-primary-100"
          >
            編輯
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMeal.isPending}
            className="text-xs text-error-500 border border-error-200 rounded-full px-2.5 py-0.5 hover:bg-error-100 active:bg-error-200 disabled:opacity-50"
          >
            {deleteMeal.isPending ? '刪除中' : '刪除'}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-2.5 space-y-1">
        {meal.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700">{item.name} {item.amount}</span>
            <span className="text-gray-400 text-xs">{Math.round(item.calories)} kcal</span>
          </div>
        ))}
      </div>

      {/* Nutrition row */}
      <div className="flex justify-around px-4 py-2 border-t border-gray-50 text-xs text-gray-500">
        <span>蛋白質 <strong className="text-gray-700">{Math.round(meal.totalProtein)}g</strong></span>
        <span>碳水 <strong className="text-gray-700">{Math.round(meal.totalCarbs)}g</strong></span>
        <span>脂肪 <strong className="text-gray-700">{Math.round(meal.totalFat)}g</strong></span>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-2.5">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">餐別</label>
            <select
              value={form.mealType}
              onChange={(e) => setForm({ ...form, mealType: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-primary-400"
            >
              {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: 'totalCalories', label: '熱量 (kcal)' },
              { key: 'totalProtein', label: '蛋白質 (g)' },
              { key: 'totalCarbs', label: '碳水 (g)' },
              { key: 'totalFat', label: '脂肪 (g)' },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-primary-400"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 border border-gray-200 rounded-full text-sm text-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={editMeal.isPending}
              className="flex-1 py-1.5 bg-primary-500 text-white rounded-full text-sm font-medium disabled:opacity-50"
            >
              {editMeal.isPending ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
