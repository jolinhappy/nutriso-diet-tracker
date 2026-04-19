import { useState } from 'react'
import { Meal, FoodItem } from '../hooks/useTodayMeals'
import { useEditMeal, useDeleteMeal, useDeleteMealItem, useReorganizeMeal, EditMealPayload, MealType, ItemWithTarget } from '../hooks/useMealMutations'

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '點心', '宵夜'] as const

interface MealItemProps {
  meal: Meal
  date: string
}

/** 從份量字串解析前導數字，例如 "200ml" → 200, "1碗" → 1 */
function parseAmountNum(amount: string): number {
  const match = amount.match(/^[\d.]+/)
  return match ? parseFloat(match[0]) : NaN
}

/** 保留份量字串的單位部分，例如 "200ml" → "ml" */
function parseAmountUnit(amount: string): string {
  return amount.replace(/^[\d.]+/, '')
}

export default function MealItem({ meal, date }: MealItemProps) {
  const [editing, setEditing] = useState(false)
  // 每個 item 的目標餐別（預設同父 meal）
  const [editItemTypes, setEditItemTypes] = useState<MealType[]>(meal.items.map(() => meal.mealType as MealType))
  // 編輯中的 items（份量 + 比例換算後的營養素）
  const [editItems, setEditItems] = useState<FoodItem[]>([...meal.items])

  const editMeal = useEditMeal(date)
  const reorganizeMeal = useReorganizeMeal(date)
  const deleteMeal = useDeleteMeal(date)
  const deleteItem = useDeleteMealItem(date)

  function handleEdit() {
    setEditItemTypes(meal.items.map(() => meal.mealType as MealType))
    setEditItems([...meal.items])
    setEditing(true)
  }

  function handleAmountChange(index: number, newAmountStr: string) {
    const original = meal.items[index]
    const origNum = parseAmountNum(original.amount)
    const newNum = parseFloat(newAmountStr)

    setEditItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const unit = parseAmountUnit(original.amount)
        const newAmount = newAmountStr + unit
        // 若可以解析數字則比例換算，否則只更新份量字串
        if (!isNaN(origNum) && !isNaN(newNum) && origNum > 0) {
          const ratio = newNum / origNum
          return {
            ...item,
            amount: newAmount,
            calories: Math.round(original.calories * ratio),
            protein:  Math.round(original.protein  * ratio * 10) / 10,
            carbs:    Math.round(original.carbs     * ratio * 10) / 10,
            fat:      Math.round(original.fat       * ratio * 10) / 10,
          }
        }
        return { ...item, amount: newAmount }
      })
    )
  }

  async function handleSave() {
    const allSameType = editItemTypes.every((t) => t === meal.mealType)

    if (!allSameType) {
      // 有 item 要移到其他餐別，走 reorganize
      const itemsWithTargets: ItemWithTarget[] = editItems.map((item, i) => ({
        item,
        targetMealType: editItemTypes[i],
      }))
      await reorganizeMeal.mutateAsync({ mealId: meal.id, items: itemsWithTargets })
    } else {
      // 全部留在同一餐別，走一般 edit
      const payload: EditMealPayload = {
        mealType: meal.mealType,
        items: editItems,
        totalCalories: editItems.reduce((s, it) => s + it.calories, 0),
        totalProtein:  editItems.reduce((s, it) => s + it.protein,  0),
        totalCarbs:    editItems.reduce((s, it) => s + it.carbs,    0),
        totalFat:      editItems.reduce((s, it) => s + it.fat,      0),
      }
      await editMeal.mutateAsync({ mealId: meal.id, data: payload })
    }
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`確定刪除這筆${meal.mealType}紀錄？`)) return
    deleteMeal.mutate(meal.id)
  }

  const displayCalories = Math.round(meal.totalCalories)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-50">
        <div className="flex items-center gap-2">
          <span className="text-primary-700 font-semibold text-sm">{meal.mealType}</span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-gray-500 text-xs">{displayCalories} kcal</span>
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
          <div key={i} className="flex items-center justify-between text-sm gap-2">
            <span className="text-gray-700 flex-1">{item.name} {item.amount}</span>
            <span className="text-gray-400 text-xs">{Math.round(item.calories)} kcal</span>
            <button
              onClick={() => deleteItem.mutate({ mealId: meal.id, itemIndex: i })}
              disabled={deleteItem.isPending}
              className="text-gray-300 hover:text-error-400 active:text-error-500 disabled:opacity-40 transition-colors"
              aria-label={`刪除 ${item.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Nutrition footer */}
      <div className="flex justify-around px-4 py-2 border-t border-gray-50 text-xs text-gray-500">
        <span>蛋白質 <strong className="text-gray-700">{Math.round(meal.totalProtein)}g</strong></span>
        <span>碳水 <strong className="text-gray-700">{Math.round(meal.totalCarbs)}g</strong></span>
        <span>脂肪 <strong className="text-gray-700">{Math.round(meal.totalFat)}g</strong></span>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
          {/* 各食物份量 + 餐別 */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500">調整份量與餐別（營養素將自動比例換算）</p>
            {editItems.map((item, i) => {
              const unit = parseAmountUnit(meal.items[i].amount)
              const currentNum = parseAmountNum(item.amount)
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 flex-1 truncate font-medium">{item.name}</span>
                    <span className="text-xs text-gray-400">{Math.round(item.calories)} kcal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={editItemTypes[i]}
                      onChange={(e) => setEditItemTypes((prev) => prev.map((t, idx) => idx === i ? e.target.value as MealType : t))}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-primary-400"
                    >
                      {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex items-center gap-1 ml-auto">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={isNaN(currentNum) ? '' : currentNum}
                        onChange={(e) => handleAmountChange(i, e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:border-primary-400 text-right"
                      />
                      {unit && <span className="text-xs text-gray-400">{unit}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 換算後合計預覽 */}
          <div className="flex justify-around py-2 bg-white rounded-lg border border-gray-100 text-xs text-gray-500">
            <span>熱量 <strong className="text-gray-700">{Math.round(editItems.reduce((s, it) => s + it.calories, 0))} kcal</strong></span>
            <span>蛋白質 <strong className="text-gray-700">{Math.round(editItems.reduce((s, it) => s + it.protein, 0))}g</strong></span>
            <span>碳水 <strong className="text-gray-700">{Math.round(editItems.reduce((s, it) => s + it.carbs, 0))}g</strong></span>
            <span>脂肪 <strong className="text-gray-700">{Math.round(editItems.reduce((s, it) => s + it.fat, 0))}g</strong></span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 border border-gray-200 rounded-full text-sm text-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={editMeal.isPending || reorganizeMeal.isPending}
              className="flex-1 py-1.5 bg-primary-500 text-white rounded-full text-sm font-medium disabled:opacity-50"
            >
              {(editMeal.isPending || reorganizeMeal.isPending) ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
