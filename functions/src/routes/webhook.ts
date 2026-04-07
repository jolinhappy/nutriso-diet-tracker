import { Router } from 'express'
import { verifyLineSignature } from '../webhook/verify'
import { handleWebhook } from '../webhook/handler'

const router = Router()

router.post('/', (req, res, next) => {
  console.log('Webhook received')
  console.log('Body:', JSON.stringify(req.body))
  console.log('Headers:', JSON.stringify(req.headers))

  const channelSecret = process.env.LINE_CHANNEL_SECRET
  if (!channelSecret) {
    console.error('[webhook] LINE_CHANNEL_SECRET is not set')
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  const signature = req.headers['x-line-signature'] as string | undefined
  if (!signature) {
    res.status(400).json({ error: 'Missing x-line-signature header' })
    return
  }

  // Firebase Functions runtime 解析 JSON body 後仍保留 rawBody（Buffer）供簽名驗證
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBody = (req as any).rawBody as Buffer | undefined
  if (!rawBody) {
    res.status(400).json({ error: 'Missing request body' })
    return
  }

  if (!verifyLineSignature(rawBody, channelSecret, signature)) {
    console.warn('[webhook] Invalid signature')
    res.status(401).json({ error: 'Invalid signature' })
    return
  }

  next()
}, handleWebhook)

export default router
