import { supabase } from '@/integrations/supabase/client';

// TODO: Create a "documents" table in Supabase with columns matching the document schema.
// Required columns: id (uuid, PK), type, document_number, status, issue_date, due_date,
// payment_date, payment_method, currency, client_name, client_company, client_address,
// client_phone, client_email, items (jsonb), subtotal, total_discount, total_tax,
// grand_total, notes, payment_terms, bank_details, company_name, company_address,
// company_phone, company_email, company_website, company_logo_url,
// created_at (timestamptz), updated_at (timestamptz)

export async function getNextDocumentNumber(type) {
  const prefix = { invoice: "INV", quotation: "QUO", receipt: "REC" }[type] || "DOC";

  const { data, error } = await supabase
    .from('documents')
    .select('document_number')
    .like('document_number', `${prefix}-%`)
    .order('document_number', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return `${prefix}-00001`;
  }

  const lastNumber = data[0].document_number;
  const numPart = parseInt(lastNumber.replace(`${prefix}-`, ''), 10);
  const next = (isNaN(numPart) ? 0 : numPart) + 1;
  return `${prefix}-${String(next).padStart(5, '0')}`;
}

export async function listDocuments(limit = 200) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getDocument(id) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDocument(doc) {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocument(id, updates) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(id) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
