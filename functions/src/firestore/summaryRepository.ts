import { db } from './db'
import { NutritionGoals } from '../types'

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65,
}

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

  const goals: NutritionGoals =
    (userSnap.data()?.goals as NutritionGoals | undefined) ?? DEFAULT_GOALS

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
    remainingCalories: goals.calories - totalCalories,
    remainingProtein: goals.protein - totalProtein,
    remainingCarbs: goals.carbs - totalCarbs,
    remainingFat: goals.fat - totalFat,
  }
}
