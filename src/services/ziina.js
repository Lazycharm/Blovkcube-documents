import { supabase } from '@/integrations/supabase/client';

export async function createZiinaPayment() {
  const { data, error } = await supabase.functions.invoke('create-ziina-payment', {
    body: {},
  });
  if (error) throw error;
  return data;
}
