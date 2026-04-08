import { Timestamp } from 'firebase-admin/firestore'
import { db } from './db'
import { NutritionGoals, FoodItem, MealType } from '../types'

export interface DailySummary {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  remainingCalories: number
  remainingProtein: number
  remainingCarbs: number
  remainingFat: number
}

export interface MealRecord {
  id: string
  mealType: MealType
  description: string
  items: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  createdAt: string
}

export interface DailyRecord {
  date: string
  meals: MealRecord[]
  summary: DailySummary
}

export interface HistoryItem {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  goalCalories: number
}

export async function getDailyRecord(
  lineUserId: string,
  date: string
): Promise<DailyRecord> {
  const [userSnap, mealsSnap] = await Promise.all([
    db.collection('users').doc(lineUserId).get(),
    db
      .collection('records')
      .doc(lineUserId)
      .collection('daily')
      .doc(date)
      .collection('meals')
      .orderBy('createdAt', 'asc')
      .get(),
  ])

  const goals: NutritionGoals | null =
    (userSnap.data()?.goals as NutritionGoals | null | undefined) ?? null

  const meals: MealRecord[] = mealsSnap.docs.map((doc) => {
    const d = doc.data()
    return {
      id: d.id as string,
      mealType: d.mealType as MealType,
      description: d.description as string,
      items: d.items as FoodItem[],
      totalCalories: d.totalCalories as number,
      totalProtein: d.totalProtein as number,
      totalCarbs: d.totalCarbs as number,
      totalFat: d.totalFat as number,
      createdAt: (d.createdAt as Timestamp)?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    }
  })

  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0
  for (const m of meals) {
    totalCalories += m.totalCalories
    totalProtein += m.totalProtein
    totalCarbs += m.totalCarbs
    totalFat += m.totalFat
  }

  return {
    date,
    meals,
    summary: {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      remainingCalories: goals ? goals.calories - totalCalories : 0,
      remainingProtein: goals ? goals.protein - totalProtein : 0,
      remainingCarbs: goals ? goals.carbs - totalCarbs : 0,
      remainingFat: goals ? goals.fat - totalFat : 0,
    },
  }
}

export async function getHistory(
  lineUserId: string,
  days: number
): Promise<HistoryItem[]> {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dates = Array.from({ length: days }, (_, i) =>
    formatter.format(new Date(Date.now() - i * 24 * 60 * 60 * 1000))
  )

  const [userSnap, ...mealsSnaps] = await Promise.all([
    db.collection('users').doc(lineUserId).get(),
    ...dates.map((date) =>
      db
        .collection('records')
        .doc(lineUserId)
        .collection('daily')
        .doc(date)
        .collection('meals')
        .get()
    ),
  ])

  const goals: NutritionGoals | null =
    (userSnap.data()?.goals as NutritionGoals | null | undefined) ?? null

  return dates.map((date, i) => {
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    for (const doc of mealsSnaps[i].docs) {
      const m = doc.data()
      totalCalories += (m.totalCalories as number) ?? 0
      totalProtein += (m.totalProtein as number) ?? 0
      totalCarbs += (m.totalCarbs as number) ?? 0
      totalFat += (m.totalFat as number) ?? 0
    }
    return { date, totalCalories, totalProtein, totalCarbs, totalFat, goalCalories: goals?.calories ?? 0 }
  })
}

export async function getDailySummary(
  lineUserId: string,
  date: string
): Promise<DailySummary> {
  const [userSnap, mealsSnap] = await Promise.all([
    db.collection('users').doc(lineUserId).get(),
    db
      .collection('records')
      .doc(lineUserId)
      .collection('daily')
      .doc(date)
      .collection('meals')
      .get(),
  ])

  const goals: NutritionGoals | null =
    (userSnap.data()?.goals as NutritionGoals | null | undefined) ?? null

  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0

  for (const doc of mealsSnap.docs) {
    const meal = doc.data()
    totalCalories += (meal.totalCalories as number) ?? 0
    totalProtein += (meal.totalProtein as number) ?? 0
    totalCarbs += (meal.totalCarbs as number) ?? 0
    totalFat += (meal.totalFat as number) ?? 0
  }

  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    remainingCalories: goals ? goals.calories - totalCalories : 0,
    remainingProtein: goals ? goals.protein - totalProtein : 0,
    remainingCarbs: goals ? goals.carbs - totalCarbs : 0,
    remainingFat: goals ? goals.fat - totalFat : 0,
  }
}
