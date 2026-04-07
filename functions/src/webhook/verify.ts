import { createHmac } from 'crypto'

export function verifyLineSignature(
  rawBody: Buffer,
  channelSecret: string,
  signature: string
): boolean {
  const hmac = createHmac('sha256', channelSecret)
  hmac.update(rawBody)
  return hmac.digest('base64') === signature
}
