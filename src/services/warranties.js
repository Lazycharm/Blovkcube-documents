import { supabase } from '@/integrations/supabase/client';

// TODO: Create a "warranties" table in Supabase with columns:
// id (uuid, PK), certificate_number, status, issue_date, expiry_date,
// warranty_duration, warranty_duration_unit,
// product_name, product_model, product_serial, product_description, product_image_url,
// client_name, client_company, client_address, client_phone, client_email, client_trn,
// company_name, company_address, company_phone, company_email, company_website, company_logo_url,
// terms, coverage, exclusions, stamp_url, signature_url,
// created_at (timestamptz), updated_at (timestamptz)

export async function getNextWarrantyNumber() {
  const prefix = "WRC";

  const { data, error } = await supabase
    .from('warranties')
    .select('certificate_number')
    .like('certificate_number', `${prefix}-%`)
    .order('certificate_number', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return `${prefix}-00001`;
  }

  const lastNumber = data[0].certificate_number;
  const numPart = parseInt(lastNumber.replace(`${prefix}-`, ''), 10);
  const next = (isNaN(numPart) ? 0 : numPart) + 1;
  return `${prefix}-${String(next).padStart(5, '0')}`;
}

export async function listWarranties(limit = 200) {
  const { data, error } = await supabase
    .from('warranties')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getWarranty(id) {
  const { data, error } = await supabase
    .from('warranties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createWarranty(warranty) {
  const { data, error } = await supabase
    .from('warranties')
    .insert(warranty)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWarranty(id, updates) {
  const { data, error } = await supabase
    .from('warranties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWarranty(id) {
  const { error } = await supabase
    .from('warranties')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
