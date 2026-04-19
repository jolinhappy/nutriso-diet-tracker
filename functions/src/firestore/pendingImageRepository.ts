import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db } from './db'

interface PendingImages {
  messageIds: string[]
  createdAt: Timestamp
}

const PENDING_EXPIRY_MS = 10 * 60 * 1000 // 10 分鐘

/** 新增一張圖片到待處理清單（已存在且未過期則 append，否則重建） */
export async function appendPendingImage(userId: string, messageId: string): Promise<void> {
  const ref = db.collection('pending_images').doc(userId)
  const snap = await ref.get()

  if (snap.exists) {
    const data = snap.data() as PendingImages
    const createdAt = data.createdAt?.toMillis() ?? 0
    const isExpired = Date.now() - createdAt > PENDING_EXPIRY_MS
    if (isExpired) {
      await ref.set({ messageIds: [messageId], createdAt: FieldValue.serverTimestamp() })
    } else {
      await ref.update({ messageIds: FieldValue.arrayUnion(messageId) })
    }
  } else {
    await ref.set({
      messageIds: [messageId],
      createdAt: FieldValue.serverTimestamp(),
    })
  }
}

/** 取得未過期的待處理圖片，過期自動清除並回傳 null */
export async function getPendingImages(userId: string): Promise<PendingImages | null> {
  const snap = await db.collection('pending_images').doc(userId).get()
  if (!snap.exists) return null
  const data = snap.data() as PendingImages
  const createdAt = data.createdAt?.toMillis() ?? 0
  if (Date.now() - createdAt > PENDING_EXPIRY_MS) {
    await snap.ref.delete()
    return null
  }
  return data
}

export async function clearPendingImages(userId: string): Promise<void> {
  await db.collection('pending_images').doc(userId).delete()
}
