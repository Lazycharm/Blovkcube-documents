import React, { useState, useEffect, useRef } from "react";
import { getDocument, createDocument, updateDocument } from "@/services/documents";
import { listClients, createClient } from "@/services/clients";
import { getNextDocumentNumber } from "@/services/documents";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { exportHtmlToPdf } from "@/utils/pdfExport";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

import ItemTable from "@/components/document/ItemTable";
import ClientSelector from "@/components/document/ClientSelector";
import CompanyInfo from "@/components/document/CompanyInfo";
import TotalsSection from "@/components/document/TotalsSection";
import DocumentTemplate from "@/components/document/DocumentTemplate";

const CURRENCIES = ["AED", "USD", "EUR", "GBP", "ZAR", "NGN", "KES", "INR"];

function generateNumber(type) {
  const prefix = { invoice: "INV", quotation: "QUO", receipt: "REC" }[type] || "DOC";
  return `${prefix}-00001`;
}

function recalcLineTotal(item) {
  const base = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  const tax = base * ((Number(item.tax_percent) || 0) / 100);
  return Math.max(0, base + tax);
}

/** Normalize line items (images + totals; discount no longer used) */
function normalizeDocumentItems(doc) {
  if (!doc?.items || !Array.isArray(doc.items)) return doc;
  return {
    ...doc,
    items: doc.items.map((item) => {
      const next = {
        ...item,
        image_url: item.image_url ?? "",
        image_url_2: item.image_url_2 ?? "",
        image_url_3: item.image_url_3 ?? "",
      };
      next.total = recalcLineTotal(next);
      return next;
    }),
  };
}

export default function CreateDocument() {
  const urlParams = new URLSearchParams(window.location.search);
  const docType = urlParams.get("type") || "invoice";
  const editId = urlParams.get("id");
  const duplicateId = urlParams.get("duplicate");

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [doc, setDoc] = useState({
    type: docType,
    document_number: generateNumber(docType),
    status: "draft",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: "",
    payment_date: docType === "receipt" ? format(new Date(), "yyyy-MM-dd") : "",
    payment_method: "",
    currency: "AED",
    client_name: "",
    client_company: "",
    client_address: "",
    client_phone: "",
    client_email: "",
    client_trn: "",
    items: [{ description: "", image_url: "", image_url_2: "", image_url_3: "", quantity: 1, unit_price: 0, tax_percent: 0, total: 0 }],
    notes: "",
    payment_terms: "",
    bank_details: "",
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    company_logo_url: "",
  });

  const { company } = useAuth();

  // Only apply the tenant's saved company defaults to a brand-new document -
  // an edit/duplicate load overwrites `doc` right after with the real saved
  // values, so this must never run for those.
  useEffect(() => {
    if (editId || duplicateId || !company) return;
    setDoc((prev) => ({
      ...prev,
      company_name: company.name || "",
      company_address: company.address || "",
      company_phone: company.phone || "",
      company_email: company.email || "",
      company_website: company.website || "",
      company_logo_url: company.logo_url || "",
      bank_details: company.bank_details || "",
    }));
  }, [company, editId, duplicateId]);

  useEffect(() => {
    const loadId = editId || duplicateId;
    if (loadId) {
      getDocument(loadId).then((found) => {
        if (found) {
          const loaded = { ...found };
          if (duplicateId) {
            delete loaded.id;
            loaded.status = "draft";
            loaded.issue_date = format(new Date(), "yyyy-MM-dd");
            getNextDocumentNumber(loaded.type).then((num) => {
              loaded.document_number = num;
              setDoc(normalizeDocumentItems(loaded));
            });
            return;
          }
          setDoc(normalizeDocumentItems(loaded));
        }
      }).catch(() => {});
    } else {
      getNextDocumentNumber(docType).then((num) => {
        setDoc((prev) => ({ ...prev, document_number: num }));
      }).catch(() => {});
    }
  }, [editId, duplicateId]);

  const updateDoc = (updates) => setDoc((prev) => ({ ...prev, ...updates }));

  const calcTotals = () => {
    const items = doc.items || [];
    const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
    const total_discount = 0;
    const total_tax = items.reduce((s, i) => {
      const base = (i.quantity || 0) * (i.unit_price || 0);
      return s + base * ((i.tax_percent || 0) / 100);
    }, 0);
    return { subtotal, total_discount, total_tax, grand_total: subtotal + total_tax };
  };

  const handleSave = async () => {
    setSaving(true);
    const totals = calcTotals();
    const payload = { ...doc, ...totals };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    // Convert empty strings to null for date columns
    const dateFields = ['issue_date', 'due_date', 'payment_date'];
    dateFields.forEach((f) => { if (payload[f] === '') payload[f] = null; });

    // Save client for reuse
    if (doc.client_name) {
      try {
        const existingClients = await listClients();
        const exists = existingClients.find((c) => c.name === doc.client_name && c.company === doc.client_company);
        if (!exists) {
          await createClient({
            name: doc.client_name,
            company: doc.client_company,
            address: doc.client_address,
            phone: doc.client_phone,
            email: doc.client_email,
          });
        }
      } catch (err) {
        console.error('Failed to save client:', err);
      }
    }

    try {
      if (editId) {
        await updateDocument(editId, payload);
      } else {
        await createDocument(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      window.location.href = createPageUrl("DocumentHistory");
    } catch (err) {
      console.error('Failed to save document:', err);
      alert('Failed to save document: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("document-preview");
    if (!element) return;
    try {
      await exportHtmlToPdf(element, `${doc.document_number}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Try again or use Print → Save as PDF.");
    }
  };

  const typeLabel = { invoice: "Tax Invoice", quotation: "Quotation", receipt: "Receipt" }[doc.type];
  const typeColor = { invoice: "text-blue-600", quotation: "text-violet-600", receipt: "text-emerald-600" }[doc.type];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="icon" className="text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {editId ? "Edit" : "New"} <span className={typeColor}>{typeLabel}</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">{doc.document_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 print:p-0">
        {/* Edit Form */}
        <div className="space-y-6 print:hidden">
              {/* Company Info */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompanyInfo data={doc} onChange={(d) => updateDoc(d)} />
                </CardContent>
              </Card>

              {/* Client + Document Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Client Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClientSelector clientData={doc} onChange={(d) => updateDoc(d)} />
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Document Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-500">Document Number</Label>
                        <Input value={doc.document_number} onChange={(e) => updateDoc({ document_number: e.target.value })} className="mt-1 border-slate-200 font-mono text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Currency</Label>
                        <Select value={doc.currency} onValueChange={(v) => updateDoc({ currency: v })}>
                          <SelectTrigger className="mt-1 border-slate-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-500">Issue Date</Label>
                        <Input type="date" value={doc.issue_date} onChange={(e) => updateDoc({ issue_date: e.target.value })} className="mt-1 border-slate-200" />
                      </div>
                      {doc.type === "invoice" && (
                        <div>
                          <Label className="text-xs text-slate-500">Due Date</Label>
                          <Input type="date" value={doc.due_date} onChange={(e) => updateDoc({ due_date: e.target.value })} className="mt-1 border-slate-200" />
                        </div>
                      )}
                      {doc.type === "quotation" && (
                        <div>
                          <Label className="text-xs text-slate-500">Valid Until</Label>
                          <Input type="date" value={doc.due_date} onChange={(e) => updateDoc({ due_date: e.target.value })} className="mt-1 border-slate-200" />
                        </div>
                      )}
                      {doc.type === "receipt" && (
                        <>
                          <div>
                            <Label className="text-xs text-slate-500">Payment Date</Label>
                            <Input type="date" value={doc.payment_date} onChange={(e) => updateDoc({ payment_date: e.target.value })} className="mt-1 border-slate-200" />
                          </div>
                        </>
                      )}
                    </div>
                    {doc.type === "receipt" && (
                      <div>
                        <Label className="text-xs text-slate-500">Payment Method</Label>
                        <Select value={doc.payment_method || ""} onValueChange={(v) => updateDoc({ payment_method: v })}>
                          <SelectTrigger className="mt-1 border-slate-200"><SelectValue placeholder="Select method" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="crypto">Crypto</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-slate-500">Status</Label>
                      <Select value={doc.status} onValueChange={(v) => updateDoc({ status: v })}>
                        <SelectTrigger className="mt-1 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doc.type === "invoice" && (
                    <div>
                      <Label className="text-xs text-slate-500">Note (beside totals)</Label>
                      <Input
                        value={doc.notes || ""}
                        onChange={(e) => updateDoc({ notes: e.target.value })}
                        placeholder="Short note shown to the left of subtotal / total..."
                        className="mt-1 border-slate-200"
                      />
                    </div>
                  )}
                  <ItemTable
                    items={doc.items}
                    onChange={(itemsOrUpdater) => {
                      setDoc((prev) => ({
                        ...prev,
                        items:
                          typeof itemsOrUpdater === "function"
                            ? itemsOrUpdater(prev.items || [])
                            : itemsOrUpdater,
                      }));
                    }}
                    currency={doc.currency}
                    docType={doc.type}
                  />
                </CardContent>
              </Card>

              {/* Totals */}
              <TotalsSection items={doc.items} currency={doc.currency} />

              {/* Notes */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Additional Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {doc.type !== "invoice" && (
                      <div>
                        <Label className="text-xs text-slate-500">Notes</Label>
                        <Textarea value={doc.notes || ""} onChange={(e) => updateDoc({ notes: e.target.value })} placeholder="Thank you for your business..." rows={4} className="mt-1 border-slate-200" />
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-slate-500">Payment Terms</Label>
                      <Textarea value={doc.payment_terms || ""} onChange={(e) => updateDoc({ payment_terms: e.target.value })} placeholder="Net 30 days..." rows={4} className="mt-1 border-slate-200" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Bank Details</Label>
                      <Textarea value={doc.bank_details || ""} onChange={(e) => updateDoc({ bank_details: e.target.value })} placeholder="Bank: ...\nAccount: ..." rows={4} className="mt-1 border-slate-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>

        </div>

        {/* Live Preview — always visible */}
        <div className="mt-8 print:mt-0">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 print:hidden">Live Preview</h2>
          <DocumentTemplate doc={doc} />
        </div>
      </div>
    </div>
  );
}