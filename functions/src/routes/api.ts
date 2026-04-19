import { Router, Request, Response, NextFunction } from 'express'
import { getUser, updateGoals, ensureUserExists } from '../firestore/userRepository'
import { updateMeal, deleteMeal, deleteMealItem, MealUpdateData, reorganizeMealItems, ItemWithTarget } from '../firestore/mealRepository'
import { getDailyRecord, getHistory } from '../firestore/summaryRepository'
import { NutritionGoals } from '../types'

const router = Router()

// 驗證 x-line-userid header 存在
function requireAuth(_req: Request, res: Response, next: NextFunction): void {
  const userId = _req.headers['x-line-userid']
  if (!userId || typeof userId !== 'string') {
    res.status(401).json({ success: false, error: 'Missing x-line-userid header' })
    return
  }
  next()
}

router.use(requireAuth)

// GET /api/users/:lineUserId
router.get('/users/:lineUserId', async (req, res) => {
  try {
    const { lineUserId } = req.params
    // 首次開啟 LIFF 時用戶可能尚未存在，自動建立（displayName 為空、goals 使用預設值）
    await ensureUserExists(lineUserId)
    const user = await getUser(lineUserId)
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }
    res.json({
      success: true,
      data: {
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        email: user.email,
        dailyGoals: user.goals,
      },
    })
  } catch (err) {
    console.error('[api] GET /users error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// POST /api/users/:lineUserId/goals
router.post('/users/:lineUserId/goals', async (req, res) => {
  try {
    const { lineUserId } = req.params
    const { calories, protein, carbs, fat } = req.body as NutritionGoals

    if (
      typeof calories !== 'number' ||
      typeof protein !== 'number' ||
      typeof carbs !== 'number' ||
      typeof fat !== 'number'
    ) {
      res.status(400).json({ success: false, error: 'Invalid goals payload' })
      return
    }

    await updateGoals(lineUserId, { calories, protein, carbs, fat })
    res.json({ success: true, data: { updatedAt: new Date().toISOString() } })
  } catch (err) {
    console.error('[api] POST /goals error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/records/:lineUserId/daily/:date
router.get('/records/:lineUserId/daily/:date', async (req, res) => {
  try {
    const { lineUserId, date } = req.params
    const record = await getDailyRecord(lineUserId, date)
    res.json({ success: true, data: record })
  } catch (err) {
    console.error('[api] GET /daily error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /api/records/:lineUserId/meals/:mealId?date=YYYY-MM-DD
router.put('/records/:lineUserId/meals/:mealId', async (req, res) => {
  try {
    const { lineUserId, mealId } = req.params
    const date = req.query.date as string
    if (!date) {
      res.status(400).json({ success: false, error: 'Missing date query param' })
      return
    }
    const data = req.body as MealUpdateData

    const found = await updateMeal(lineUserId, mealId, date, data)
    if (!found) {
      res.status(404).json({ success: false, error: 'Meal not found' })
      return
    }
    res.json({ success: true, data: { updatedAt: new Date().toISOString() } })
  } catch (err) {
    console.error('[api] PUT /meals error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// DELETE /api/records/:lineUserId/meals/:mealId?date=YYYY-MM-DD
router.delete('/records/:lineUserId/meals/:mealId', async (req, res) => {
  try {
    const { lineUserId, mealId } = req.params
    const date = req.query.date as string
    if (!date) {
      res.status(400).json({ success: false, error: 'Missing date query param' })
      return
    }

    const found = await deleteMeal(lineUserId, mealId, date)
    if (!found) {
      res.status(404).json({ success: false, error: 'Meal not found' })
      return
    }
    res.json({ success: true, data: { deletedAt: new Date().toISOString() } })
  } catch (err) {
    console.error('[api] DELETE /meals error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// DELETE /api/records/:lineUserId/meals/:mealId/items/:itemIndex?date=YYYY-MM-DD
router.delete('/records/:lineUserId/meals/:mealId/items/:itemIndex', async (req, res) => {
  try {
    const { lineUserId, mealId, itemIndex } = req.params
    const date = req.query.date as string
    if (!date) {
      res.status(400).json({ success: false, error: 'Missing date query param' })
      return
    }
    const index = parseInt(itemIndex, 10)
    if (isNaN(index)) {
      res.status(400).json({ success: false, error: 'Invalid itemIndex' })
      return
    }

    const found = await deleteMealItem(lineUserId, mealId, date, index)
    if (!found) {
      res.status(404).json({ success: false, error: 'Meal or item not found' })
      return
    }
    res.json({ success: true, data: { deletedAt: new Date().toISOString() } })
  } catch (err) {
    console.error('[api] DELETE /meals/items error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /api/records/:lineUserId/meals/:mealId/reorganize?date=YYYY-MM-DD
router.put('/records/:lineUserId/meals/:mealId/reorganize', async (req, res) => {
  try {
    const { lineUserId, mealId } = req.params
    const date = req.query.date as string
    if (!date) {
      res.status(400).json({ success: false, error: 'Missing date query param' })
      return
    }
    const { items } = req.body as { items: ItemWithTarget[] }
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'Invalid items payload' })
      return
    }

    const found = await reorganizeMealItems(lineUserId, mealId, date, items)
    if (!found) {
      res.status(404).json({ success: false, error: 'Meal not found' })
      return
    }
    res.json({ success: true, data: { updatedAt: new Date().toISOString() } })
  } catch (err) {
    console.error('[api] PUT /meals/reorganize error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// GET /api/records/:lineUserId/history?days=7
router.get('/records/:lineUserId/history', async (req, res) => {
  try {
    const { lineUserId } = req.params
    const days = Math.min(parseInt(req.query.days as string) || 7, 30)

    const history = await getHistory(lineUserId, days)
    res.json({ success: true, data: history })
  } catch (err) {
    console.error('[api] GET /history error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
