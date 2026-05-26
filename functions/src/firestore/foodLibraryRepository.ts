import { FieldValue } from 'firebase-admin/firestore'
import { db } from './db'
import { FoodItem, FoodLibraryItem } from '../types'

function getLibraryRef(lineUserId: string) {
  return db.collection('users').doc(lineUserId).collection('foodLibrary')
}

export async function upsertFoodItem(lineUserId: string, item: FoodItem): Promise<void> {
  const nameLower = item.name.trim().toLowerCase()
  if (!nameLower) return

  const ref = getLibraryRef(lineUserId)
  const existing = await ref.where('nameLower', '==', nameLower).limit(1).get()

  if (!existing.empty) {
    await existing.docs[0].ref.update({
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      amount: item.amount,
      usageCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  } else {
    const docRef = ref.doc()
    await docRef.set({
      id: docRef.id,
      name: item.name.trim(),
      nameLower,
      amount: item.amount ?? '',
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      usageCount: 1,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

export async function getFoodLibrary(lineUserId: string): Promise<FoodLibraryItem[]> {
  const snap = await getLibraryRef(lineUserId)
    .orderBy('usageCount', 'desc')
    .get()

  return snap.docs.map(doc => {
    const d = doc.data()
    return {
      id: d.id,
      name: d.name,
      amount: d.amount,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      usageCount: d.usageCount,
    }
  })
}

export async function deleteFoodFromLibrary(lineUserId: string, foodId: string): Promise<boolean> {
  const ref = getLibraryRef(lineUserId).doc(foodId)
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.delete()
  return true
}
