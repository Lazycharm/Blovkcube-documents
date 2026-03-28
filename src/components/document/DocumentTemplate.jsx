import React from "react";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import logoImg from "@/images/logo.png";
import stampImg from "@/images/stamp.png";
import signatureImg from "@/images/signature.png";

export default function DocumentTemplate({ doc }) {
  const sym = { AED: "AED ", USD: "$", EUR: "€", GBP: "£", ZAR: "R", NGN: "₦", KES: "KSh", INR: "₹" }[doc.currency] || doc.currency + " ";
  const typeLabel = { invoice: "TAX INVOICE", quotation: "QUOTATION", receipt: "RECEIPT" }[doc.type] || "DOCUMENT";
  const accentColor = { invoice: "#2563EB", quotation: "#7C3AED", receipt: "#059669" }[doc.type] || "#2563EB";

  const items = doc.items || [];
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const totalTax = items.reduce((s, i) => {
    const base = (i.quantity || 0) * (i.unit_price || 0);
    return s + base * ((i.tax_percent || 0) / 100);
  }, 0);
  const grandTotal = subtotal + totalTax;

  const fmtDate = (d) => {
    if (!d) return "—";
    return format(new Date(d), "MMM dd, yyyy");
  };

  const hasNotesOrTerms = !!(doc.notes || doc.payment_terms);

  return (
    <div
      id="document-preview"
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto print:shadow-none print:overflow-visible"
    >
      {/* Header bar */}
      <div style={{ backgroundColor: accentColor }} className="h-2 print:h-1" />

      <div className="p-6 md:p-8 print:p-2 print:px-3 print:pt-2 print:pb-2">
        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 print:gap-2 print:mb-2">
          <div className="flex items-start gap-3 print:gap-2">
            <img src={logoImg} alt="Logo" className="w-14 h-14 print:w-10 print:h-10 object-contain rounded-xl" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 print:text-base print:leading-tight">{doc.company_name || "Blockcube"}</h2>
              {doc.company_address && <p className="text-xs text-slate-500 mt-0.5 print:text-[10px] print:leading-snug">{doc.company_address}</p>}
              {doc.company_phone && <p className="text-xs text-slate-500 print:text-[10px] print:leading-snug">{doc.company_phone}</p>}
              {doc.company_email && <p className="text-xs text-slate-500 print:text-[10px] print:leading-snug">{doc.company_email}</p>}
              {doc.company_website && <p className="text-xs text-slate-500 print:text-[10px] print:leading-snug">{doc.company_website}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold tracking-wider print:text-lg print:leading-none" style={{ color: accentColor }}>{typeLabel}</span>
            <p className="text-sm text-slate-600 mt-1 font-mono print:text-xs print:mt-0.5">{doc.document_number}</p>
          </div>
        </div>

        {/* Client and dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:gap-3 print:mb-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 print:mb-1">Bill To</p>
            <p className="font-semibold text-slate-900 print:text-sm">{doc.client_name || "—"}</p>
            {doc.client_company && <p className="text-sm text-slate-600 print:text-xs print:leading-snug">{doc.client_company}</p>}
            {doc.client_address && <p className="text-sm text-slate-500 print:text-xs print:leading-snug">{doc.client_address}</p>}
            {doc.client_phone && <p className="text-sm text-slate-500 print:text-xs print:leading-snug">{doc.client_phone}</p>}
            {doc.client_email && <p className="text-sm text-slate-500 print:text-xs print:leading-snug">{doc.client_email}</p>}
            {doc.client_trn && <p className="text-sm text-slate-500 print:text-xs print:leading-snug">TRN: {doc.client_trn}</p>}
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2 print:mb-1">Details</p>
            <div className="space-y-1 text-sm print:text-xs print:space-y-0">
              <p><span className="text-slate-500">Issue Date:</span> <span className="text-slate-800 font-medium">{fmtDate(doc.issue_date)}</span></p>
              {doc.type === "invoice" && <p><span className="text-slate-500">Due Date:</span> <span className="text-slate-800 font-medium">{fmtDate(doc.due_date)}</span></p>}
              {doc.type === "quotation" && <p><span className="text-slate-500">Valid Until:</span> <span className="text-slate-800 font-medium">{fmtDate(doc.due_date)}</span></p>}
              {doc.type === "receipt" && (
                <>
                  <p><span className="text-slate-500">Payment Date:</span> <span className="text-slate-800 font-medium">{fmtDate(doc.payment_date)}</span></p>
                  {doc.payment_method && <p><span className="text-slate-500">Payment Method:</span> <span className="text-slate-800 font-medium">{doc.payment_method}</span></p>}
                </>
              )}
              <p><span className="text-slate-500">Currency:</span> <span className="text-slate-800 font-medium">{doc.currency}</span></p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 print:mb-2 print:rounded-md">
          <table className="w-full text-sm print:text-[11px] print:break-inside-auto">
            <thead>
              <tr style={{ backgroundColor: accentColor + "08" }}>
                <th className="text-center py-3 px-2 w-10 font-semibold text-slate-700 print:py-1 print:px-1">#</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700 print:py-1 print:px-2">Description</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-700 print:py-1 print:px-1">Qty</th>
                <th className="text-right py-3 px-3 font-semibold text-slate-700 print:py-1 print:px-1">Price</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-700 print:py-1 print:px-1">Tax</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700 print:py-1 print:px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-slate-100 break-inside-avoid">
                  <td className="py-3 px-2 text-center text-slate-600 font-medium tabular-nums print:py-1 print:px-1">{i + 1}</td>
                  <td className="py-3 px-4 text-slate-800 print:py-1 print:px-2">
                    <div className="print:leading-snug">{item.description || "—"}</div>
                    {doc.type === "quotation" && (item.image_url || item.image_url_2 || item.image_url_3) && (
                      <div className="mt-2 flex flex-wrap gap-2 print:mt-1 print:gap-1">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt="Item 1"
                            className="w-20 h-20 print:w-12 print:h-12 object-cover rounded border border-slate-200 bg-white"
                          />
                        )}
                        {item.image_url_2 && (
                          <img
                            src={item.image_url_2}
                            alt="Item 2"
                            className="w-20 h-20 print:w-12 print:h-12 object-cover rounded border border-slate-200 bg-white"
                          />
                        )}
                        {item.image_url_3 && (
                          <img
                            src={item.image_url_3}
                            alt="Item 3"
                            className="w-20 h-20 print:w-12 print:h-12 object-cover rounded border border-slate-200 bg-white"
                          />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600 print:py-1 print:px-1">{item.quantity}</td>
                  <td className="py-3 px-3 text-right text-slate-600 print:py-1 print:px-1">{sym}{(item.unit_price || 0).toFixed(2)}</td>
                  <td className="py-3 px-3 text-center text-slate-600 print:py-1 print:px-1">{item.tax_percent || 0}%</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800 print:py-1 print:px-2">{sym}{(item.total || 0).toFixed(2)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">No items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Notes / payment terms (left) + Totals (right) — one row to save vertical space */}
        <div
          className={`flex flex-col md:flex-row md:items-start gap-4 mb-4 print:mb-2 print:gap-3 ${
            hasNotesOrTerms ? "md:justify-between" : "md:justify-end"
          }`}
        >
          {hasNotesOrTerms && (
            <div className="min-w-0 flex-1 space-y-3 print:space-y-2 text-sm print:text-xs">
              {doc.type === "invoice" && doc.notes && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1 print:mb-0">Note</p>
                  <p className="text-slate-600 whitespace-pre-wrap print:leading-snug">{doc.notes}</p>
                </div>
              )}
              {doc.type !== "invoice" && doc.notes && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1 print:mb-0">Notes</p>
                  <p className="text-slate-600 whitespace-pre-wrap print:leading-snug">{doc.notes}</p>
                </div>
              )}
              {doc.payment_terms && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1 print:mb-0">Payment Terms</p>
                  <p className="text-slate-600 whitespace-pre-wrap print:leading-snug">{doc.payment_terms}</p>
                </div>
              )}
            </div>
          )}
          <div className="shrink-0 flex justify-end w-full md:w-auto">
            <div className="w-full max-w-[16rem] space-y-2 print:space-y-0.5">
              <div className="flex justify-between text-sm text-slate-600 print:text-xs">
                <span>Subtotal</span>
                <span>{sym}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 print:text-xs">
                <span>Tax</span>
                <span>{sym}{totalTax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline gap-4 text-lg font-bold text-slate-900 print:pt-1 print:text-base">
                <span className="pr-2 tracking-wide">Total</span>
                <span className="pl-2 shrink-0 tabular-nums" style={{ color: accentColor }}>{sym}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details & Stamp — keep together on print (avoid page break inside) */}
        <div
          className="document-print-footer grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2 pt-4 border-t border-slate-100 print:border-slate-200 print:mt-0 print:pt-2 print:gap-3"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          {doc.bank_details && (
            <div className="min-w-0" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Bank Details</p>
              <p className="text-slate-600 whitespace-pre-wrap text-xs leading-relaxed print:text-[10px] print:leading-snug">{doc.bank_details}</p>
            </div>
          )}

          {/* Stamp & Signature — single unbreakable cluster */}
          <div className="flex flex-col items-end justify-end min-w-0">
            <div
              className="text-center document-signature-cluster"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <img src={stampImg} alt="Stamp" className="w-32 h-32 object-contain mx-auto mb-1 print:w-24 print:h-24 print:mb-0" />
              <img src={signatureImg} alt="Signature" className="w-28 h-12 object-contain mx-auto mb-1 print:w-24 print:h-10 print:mb-0" />
              <p className="text-xs text-slate-400 print:whitespace-nowrap">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}