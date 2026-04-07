import { FieldValue, DocumentReference } from 'firebase-admin/firestore'
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

// collectionGroup query — 生產環境需在 Firestore 建立 id 欄位的 single-field index
async function findMealRef(
  lineUserId: string,
  mealId: string
): Promise<DocumentReference | null> {
  const snap = await db.collectionGroup('meals').where('id', '==', mealId).get()
  const doc = snap.docs.find((d) => d.ref.path.includes(`/records/${lineUserId}/`))
  return doc?.ref ?? null
}

export async function updateMeal(
  lineUserId: string,
  mealId: string,
  data: MealUpdateData
): Promise<boolean> {
  const ref = await findMealRef(lineUserId, mealId)
  if (!ref) return false
  await ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() })
  return true
}

export async function deleteMeal(
  lineUserId: string,
  mealId: string
): Promise<boolean> {
  const ref = await findMealRef(lineUserId, mealId)
  if (!ref) return false
  await ref.delete()
  return true
}
