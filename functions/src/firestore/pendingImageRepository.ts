import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db } from './db'

interface PendingImages {
  messageIds: string[]
  createdAt: Timestamp
}

/** 新增一張圖片到待處理清單（已存在則 append，不存在則建立） */
export async function appendPendingImage(userId: string, messageId: string): Promise<void> {
  const ref = db.collection('pending_images').doc(userId)
  const snap = await ref.get()

  if (snap.exists) {
    await ref.update({ messageIds: FieldValue.arrayUnion(messageId) })
  } else {
    await ref.set({
      messageIds: [messageId],
      createdAt: FieldValue.serverTimestamp(),
    })
  }
}

export async function getPendingImages(userId: string): Promise<PendingImages | null> {
  const snap = await db.collection('pending_images').doc(userId).get()
  if (!snap.exists) return null
  return snap.data() as PendingImages
}

export async function clearPendingImages(userId: string): Promise<void> {
  await db.collection('pending_images').doc(userId).delete()
}
