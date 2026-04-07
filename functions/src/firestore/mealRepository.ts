import { FieldValue } from 'firebase-admin/firestore'
import { db } from './db'
import { AiParsedMeal } from '../types'

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
