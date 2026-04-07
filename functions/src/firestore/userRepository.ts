import { FieldValue } from 'firebase-admin/firestore'
import { db } from './db'
import { NutritionGoals } from '../types'

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65,
}

export interface UserDoc {
  lineUserId: string
  displayName: string
  email: string | null
  goals: NutritionGoals
}

export async function getUser(lineUserId: string): Promise<UserDoc | null> {
  const snap = await db.collection('users').doc(lineUserId).get()
  if (!snap.exists) return null
  return snap.data() as UserDoc
}

export async function updateGoals(
  lineUserId: string,
  goals: NutritionGoals
): Promise<void> {
  await db.collection('users').doc(lineUserId).set(
    { goals, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
}

export async function ensureUserExists(lineUserId: string): Promise<void> {
  const userRef = db.collection('users').doc(lineUserId)
  const snapshot = await userRef.get()

  if (snapshot.exists) return

  await userRef.set({
    lineUserId,
    displayName: '',
    email: null,
    goals: DEFAULT_GOALS,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  console.log(`[firestore] created user: ${lineUserId}`)
}
