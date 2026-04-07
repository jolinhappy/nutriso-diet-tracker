import { FieldValue } from 'firebase-admin/firestore'
import { db } from './db'

const DEFAULT_GOALS = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 65,
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
