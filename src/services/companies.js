import { supabase } from '@/integrations/supabase/client';

export async function getMyCompany() {
  const { data, error } = await supabase
    .from('company_members')
    .select('role, companies(*)')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data.companies, role: data.role } : null;
}

export async function updateCompany(companyId, updates) {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listTeam(companyId) {
  const { data, error } = await supabase
    .from('company_members')
    .select('user_id, role, created_at')
    .eq('company_id', companyId);
  if (error) throw error;
  return data ?? [];
}

export async function getMySubscription(companyId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
