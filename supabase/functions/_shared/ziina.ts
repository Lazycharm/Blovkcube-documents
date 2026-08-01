// Ziina client — Payment Intent + Webhook verification.
// Same proven implementation as CareerPilot/WA Filter/CashLink/SoftPoint
// (https://docs.ziina.com/api-reference). Deno port because this is a
// Vite+Supabase Edge Functions app, not Next.js.
//
// Key facts:
//   - Amount is in fils. Minimum payment is 200 (2 AED).
//   - operation_id/metadata are response-only, never sent in the request.
//   - Webhook signature: X-Hmac-Signature = hex SHA-256 HMAC of the raw body.
//   - Webhook IP allowlist: 3.29.184.186, 3.29.190.95, 20.233.47.127, 13.202.161.181.

const ZIINA_BASE = 'https://api-v2.ziina.com'

export const ZIINA_WEBHOOK_IPS = [
  '3.29.184.186',
  '3.29.190.95',
  '20.233.47.127',
  '13.202.161.181',
]

export interface CreateIntentInput {
  amountFils: number
  currency?: string
  description?: string
  successUrl: string
  cancelUrl: string
  failureUrl?: string
  test?: boolean
}

export async function createZiinaIntent(apiKey: string, input: CreateIntentInput) {
  if (!apiKey) throw new Error('ZIINA_API_KEY is not set')
  if (input.amountFils < 200) {
    throw new Error(`Ziina minimum amount is 200 fils (2 AED); got ${input.amountFils}`)
  }

  const body = {
    amount: input.amountFils,
    currency_code: input.currency ?? 'AED',
    message: input.description,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    failure_url: input.failureUrl,
    test: input.test ?? false,
  }

  const resp = await fetch(`${ZIINA_BASE}/api/payment_intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Ziina createIntent ${resp.status}: ${text.slice(0, 500)}`)
  }

  const data = await resp.json()
  return { id: data.id, redirectUrl: data.redirect_url, status: data.status, raw: data }
}

/** Verify a Ziina webhook signature. Pass the RAW request body (before JSON.parse). */
export async function verifyZiinaSignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!secret || !signatureHeader) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('')

  // Constant-time-ish comparison (Deno has no built-in timingSafeEqual;
  // this XOR-accumulate pattern avoids early-exit branching on mismatch).
  const a = expected
  const b = signatureHeader.trim()
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function isZiinaWebhookIP(ip: string | null): boolean {
  if (!ip) return false
  return ZIINA_WEBHOOK_IPS.includes(ip.trim())
}
