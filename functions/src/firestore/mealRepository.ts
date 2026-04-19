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

  // 查詢今天是否已有同餐別紀錄
  const existing = await mealsRef.where('mealType', '==', meal.mealType).limit(1).get()

  if (!existing.empty) {
    // 合併到既有紀錄
    const docRef = existing.docs[0].ref
    const prev = existing.docs[0].data() as {
      items: FoodItem[]
      totalCalories: number
      totalProtein: number
      totalCarbs: number
      totalFat: number
    }

    const mergedItems = [...prev.items, ...meal.items]
    await docRef.update({
      items: mergedItems,
      totalCalories: prev.totalCalories + meal.totalCalories,
      totalProtein:  prev.totalProtein  + meal.totalProtein,
      totalCarbs:    prev.totalCarbs    + meal.totalCarbs,
      totalFat:      prev.totalFat      + meal.totalFat,
      updatedAt: FieldValue.serverTimestamp(),
    })

    console.log(`[firestore] merged meal ${docRef.id} for ${lineUserId} on ${date}`)
    return docRef.id
  }

  // 新增
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

function calcTotals(items: FoodItem[]) {
  return {
    totalCalories: items.reduce((s, it) => s + it.calories, 0),
    totalProtein:  items.reduce((s, it) => s + it.protein, 0),
    totalCarbs:    items.reduce((s, it) => s + it.carbs, 0),
    totalFat:      items.reduce((s, it) => s + it.fat, 0),
  }
}

export interface ItemWithTarget {
  item: FoodItem
  targetMealType: MealType
}

/**
 * 按各 item 的目標餐別重新分配：
 * - 留在原餐別的 → 更新原 meal（若全部移走則刪除）
 * - 移往其他餐別的 → 合併到當天既有同類 meal，或新建
 */
export async function reorganizeMealItems(
  lineUserId: string,
  sourceMealId: string,
  date: string,
  itemsWithTargets: ItemWithTarget[]
): Promise<boolean> {
  const sourceRef = getMealRef(lineUserId, date, sourceMealId)
  const sourceSnap = await sourceRef.get()
  if (!sourceSnap.exists) return false

  const sourceMealType = (sourceSnap.data() as { mealType: MealType }).mealType
  const mealsRef = db
    .collection('records')
    .doc(lineUserId)
    .collection('daily')
    .doc(date)
    .collection('meals')

  // 按目標餐別分組
  const groups = new Map<MealType, FoodItem[]>()
  for (const { item, targetMealType } of itemsWithTargets) {
    if (!groups.has(targetMealType)) groups.set(targetMealType, [])
    groups.get(targetMealType)!.push(item)
  }

  // 處理原 meal（留下 or 刪除）
  const stayingItems = groups.get(sourceMealType) ?? []
  if (stayingItems.length === 0) {
    await sourceRef.delete()
  } else {
    await sourceRef.update({
      items: stayingItems,
      ...calcTotals(stayingItems),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  // 將移走的 items 合併到目標餐別
  for (const [mealType, items] of groups) {
    if (mealType === sourceMealType) continue

    const existing = await mealsRef.where('mealType', '==', mealType).limit(1).get()
    if (!existing.empty) {
      const prev = existing.docs[0].data() as { items: FoodItem[] }
      const merged = [...prev.items, ...items]
      await existing.docs[0].ref.update({
        items: merged,
        ...calcTotals(merged),
        updatedAt: FieldValue.serverTimestamp(),
      })
    } else {
      const newRef = mealsRef.doc()
      await newRef.set({
        id: newRef.id,
        mealType,
        description: `[移入] ${mealType}`,
        items,
        ...calcTotals(items),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
  }

  return true
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
