import { FieldValue } from 'firebase-admin/firestore'
import { db } from './db'
import { AiParsedMeal, FoodItem, MealType } from '../types'

function getTaipeiDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export async function saveMeal(
  lineUserId: string,
  description: string,
  meal: AiParsedMeal
): Promise<string> {
  const date = getTaipeiDate()

  const mealsRef = db
    .collection('records')
    .doc(lineUserId)
    .collection('daily')
    .doc(date)
    .collection('meals')

  // 先拿 auto-generated ID，再用 set 一次寫入（包含 id 欄位）
  const docRef = mealsRef.doc()

  await docRef.set({
    id: docRef.id,
    mealType: meal.mealType,
    description,
    items: meal.items,
    totalCalories: meal.totalCalories,
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  console.log(`[firestore] saved meal ${docRef.id} for ${lineUserId} on ${date}`)
  return docRef.id
}

export interface MealUpdateData {
  mealType?: MealType
  items?: FoodItem[]
  totalCalories?: number
  totalProtein?: number
  totalCarbs?: number
  totalFat?: number
}

function getMealRef(lineUserId: string, date: string, mealId: string) {
  return db
    .collection('records')
    .doc(lineUserId)
    .collection('daily')
    .doc(date)
    .collection('meals')
    .doc(mealId)
}

export async function updateMeal(
  lineUserId: string,
  mealId: string,
  date: string,
  data: MealUpdateData
): Promise<boolean> {
  const ref = getMealRef(lineUserId, date, mealId)
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() })
  return true
}

export async function deleteMeal(
  lineUserId: string,
  mealId: string,
  date: string
): Promise<boolean> {
  const ref = getMealRef(lineUserId, date, mealId)
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.delete()
  return true
}

export async function deleteMealItem(
  lineUserId: string,
  mealId: string,
  date: string,
  itemIndex: number
): Promise<boolean> {
  const ref = getMealRef(lineUserId, date, mealId)
  const snap = await ref.get()
  if (!snap.exists) return false

  const data = snap.data() as {
    items: FoodItem[]
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
  }

  if (itemIndex < 0 || itemIndex >= data.items.length) return false

  const newItems = data.items.filter((_, i) => i !== itemIndex)

  // 最後一項刪掉就刪整筆 meal
  if (newItems.length === 0) {
    await ref.delete()
    return true
  }

  const totalCalories = newItems.reduce((s, item) => s + item.calories, 0)
  const totalProtein  = newItems.reduce((s, item) => s + item.protein, 0)
  const totalCarbs    = newItems.reduce((s, item) => s + item.carbs, 0)
  const totalFat      = newItems.reduce((s, item) => s + item.fat, 0)

  await ref.update({
    items: newItems,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return true
}
