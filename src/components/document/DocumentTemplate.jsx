import React from "react";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import logoImg from "@/images/logo.png";
import stampImg from "@/images/stamp.png";

export default function DocumentTemplate({ doc }) {
  const sym = { AED: "AED ", USD: "$", EUR: "€", GBP: "£", ZAR: "R", NGN: "₦", KES: "KSh", INR: "₹" }[doc.currency] || doc.currency + " ";
  const typeLabel = { invoice: "INVOICE", quotation: "QUOTATION", receipt: "RECEIPT" }[doc.type] || "DOCUMENT";
  const accentColor = { invoice: "#2563EB", quotation: "#7C3AED", receipt: "#059669" }[doc.type] || "#2563EB";

  const items = doc.items || [];
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const totalDiscount = items.reduce((s, i) => s + (i.discount || 0), 0);
  const totalTax = items.reduce((s, i) => {
    const base = (i.quantity || 0) * (i.unit_price || 0) - (i.discount || 0);
    return s + base * ((i.tax_percent || 0) / 100);
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const fmtDate = (d) => {
    if (!d) return "—";
    return format(new Date(d), "MMM dd, yyyy");
  };

  return (
    <div id="document-preview" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
      {/* Header bar */}
      <div style={{ backgroundColor: accentColor }} className="h-2" />

      <div className="p-6 md:p-8">
        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <img src={logoImg} alt="Logo" className="w-14 h-14 object-contain rounded-xl" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">{doc.company_name || "Blockcube"}</h2>
              {doc.company_address && <p className="text-xs text-slate-500 mt-0.5">{doc.company_address}</p>}
              {doc.company_phone && <p className="text-xs text-slate-500">{doc.company_phone}</p>}
              {doc.company_email && <p className="text-xs text-slate-500">{doc.company_email}</p>}
              {doc.company_website && <p className="text-xs text-slate-500">{doc.company_website}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold tracking-wider" style={{ color: accentColor }}>{typeLabel}</span>
            <p className="text-sm text-slate-600 mt-1 font-mono">{doc.document_number}</p>
          </div>
        </div>

        {/* Client and dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Bill To</p>
            <p className="font-semibold text-slate-900">{doc.client_name || "—"}</p>
            {doc.client_company && <p className="text-sm text-slate-600">{doc.client_company}</p>}
            {doc.client_address && <p className="text-sm text-slate-500">{doc.client_address}</p>}
            {doc.client_phone && <p className="text-sm text-slate-500">{doc.client_phone}</p>}
            {doc.client_email && <p className="text-sm text-slate-500">{doc.client_email}</p>}
            {doc.client_trn && <p className="text-sm text-slate-500">TRN: {doc.client_trn}</p>}
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Details</p>
            <div className="space-y-1 text-sm">
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
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: accentColor + "08" }}>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-700">Qty</th>
                <th className="text-right py-3 px-3 font-semibold text-slate-700">Price</th>
                <th className="text-right py-3 px-3 font-semibold text-slate-700">Disc.</th>
                <th className="text-center py-3 px-3 font-semibold text-slate-700">Tax</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-3 px-4 text-slate-800">{item.description || "—"}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3 px-3 text-right text-slate-600">{sym}{(item.unit_price || 0).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-slate-600">{item.discount ? `${sym}${item.discount.toFixed(2)}` : "—"}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{item.tax_percent || 0}%</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">{sym}{(item.total || 0).toFixed(2)}</td>
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

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>{sym}{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span><span>-{sym}{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax</span><span>{sym}{totalTax.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-bold text-slate-900">
              <span>Total</span><span style={{ color: accentColor }}>{sym}{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Payment Terms — side by side */}
        {(doc.notes || doc.payment_terms) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            {doc.notes && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Notes</p>
                <p className="text-slate-600 whitespace-pre-wrap">{doc.notes}</p>
              </div>
            )}
            {doc.payment_terms && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Payment Terms</p>
                <p className="text-slate-600 whitespace-pre-wrap">{doc.payment_terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Bank Details & Stamp — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {doc.bank_details && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Bank Details</p>
              <p className="text-slate-600 whitespace-pre-wrap text-xs leading-relaxed">{doc.bank_details}</p>
            </div>
          )}

          {/* Stamp & Signature — right column */}
          <div className="flex flex-col items-end justify-end">
            <div className="text-center">
              <img src={stampImg} alt="Stamp" className="w-24 h-24 object-contain mx-auto mb-1" />
              <p className="text-xs text-slate-400">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}