// Creates a real Ziina payment intent to upgrade the caller's own company
// to the Pro plan. Deploy with: supabase functions deploy create-ziina-payment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createZiinaIntent } from '../_shared/ziina.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pro plan price. Adjust here if pricing changes — single source of truth.
const PRO_PRICE_AED = 49;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The caller's own company only — never trust a company_id from the client.
    const { data: membership, error: membershipError } = await supabaseClient
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: 'No company found for this account' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountFils = Math.round(PRO_PRICE_AED * 100);
    // No PUBLIC_APP_URL fallback on purpose - this app has no deployed
    // domain yet (dormant since March 2026). Must be set for real at deploy
    // time, same as CashLink/SoftPoint's Ziina functions.
    const appUrl = Deno.env.get('PUBLIC_APP_URL');
    if (!appUrl) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: PUBLIC_APP_URL is not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const intent = await createZiinaIntent(Deno.env.get('ZIINA_API_KEY') ?? '', {
      amountFils,
      description: 'Invoice Pro subscription',
      successUrl: `${appUrl}/CompanySettings?ziina=success`,
      cancelUrl: `${appUrl}/Subscribe?ziina=cancelled`,
      test: Deno.env.get('ZIINA_TEST_MODE') === 'true',
    });

    await supabaseClient
      .from('subscriptions')
      .update({ ziina_intent_id: intent.id })
      .eq('company_id', membership.company_id);

    return new Response(
      JSON.stringify({ redirectUrl: intent.redirectUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
