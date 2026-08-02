// Real Ziina webhook handler. Only a correctly-signed request can ever
// activate a subscription — the HMAC signature (verified below) is the
// real security boundary.
// Deploy with: supabase functions deploy ziina-webhook --no-verify-jwt
// (webhooks aren't authenticated with a user JWT — the signature IS the auth)
//
// 2026-08-02: this account's single Ziina webhook is registered against
// CareerPilot's URL (Ziina allows only one URL per account), which
// forwards the untouched raw body + signature here. A real forward
// legitimately arrives from Vercel's egress IP, not one of Ziina's 4
// direct-delivery IPs — so the IP allowlist can no longer be a hard gate
// without breaking that forward. Signature verification alone is
// cryptographically sufficient (only Ziina and the systems holding the
// shared secret can produce a valid one); IP is logged for visibility
// only, not enforced.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyZiinaSignature, isZiinaWebhookIP } from '../_shared/ziina.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const sourceIp = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip');
  if (!isZiinaWebhookIP(sourceIp)) {
    console.warn('Webhook from non-Ziina-direct IP (expected if forwarded via the CareerPilot hub):', sourceIp);
  }

  const rawBody = await req.text();
  const signature = req.headers.get('X-Hmac-Signature');
  const secret = Deno.env.get('ZIINA_WEBHOOK_SECRET') ?? '';
  const validSignature = await verifyZiinaSignature(rawBody, signature, secret);
  if (!validSignature) {
    console.error('Rejected webhook with invalid signature');
    return new Response('Forbidden', { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (event.event !== 'payment_intent.status.updated' || event.data?.status !== 'completed') {
    // Not an event we act on (pending/failed/canceled updates, refunds, etc).
    return new Response('ok', { status: 200 });
  }

  const intentId = event.data?.id;
  if (!intentId) {
    return new Response('ok', { status: 200 });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: subscription, error: fetchError } = await supabaseClient
    .from('subscriptions')
    .select('*')
    .eq('ziina_intent_id', intentId)
    .single();

  if (fetchError || !subscription) {
    console.error('No subscription found for Ziina intent', intentId);
    return new Response('ok', { status: 200 });
  }

  // Idempotent — Ziina can retry webhook delivery; a second completed event
  // for an already-active period must not extend it again.
  const alreadyActive = subscription.plan === 'pro' && subscription.status === 'active'
    && subscription.current_period_end && new Date(subscription.current_period_end) > new Date();
  if (alreadyActive) {
    return new Response('ok', { status: 200 });
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await supabaseClient
    .from('subscriptions')
    .update({
      plan: 'pro',
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', subscription.company_id);

  return new Response('ok', { status: 200 });
});
