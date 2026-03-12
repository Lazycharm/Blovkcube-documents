import React from "react";
import { format } from "date-fns";
import { ShieldCheck } from "lucide-react";

export default function WarrantyTemplate({ warranty }) {
  const w = warranty;

  const fmtDate = (d) => {
    if (!d) return "—";
    return format(new Date(d), "MMM dd, yyyy");
  };

  return (
    <div id="warranty-preview" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl mx-auto">
      {/* Top accent */}
      <div className="h-2 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600" />

      <div className="p-8 md:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            {w.company_logo_url ? (
              <img src={w.company_logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                <ShieldCheck className="w-7 h-7 text-amber-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{w.company_name || "Company"}</h2>
              {w.company_address && <p className="text-xs text-slate-500 mt-0.5">{w.company_address}</p>}
              {w.company_phone && <p className="text-xs text-slate-500">{w.company_phone}</p>}
              {w.company_email && <p className="text-xs text-slate-500">{w.company_email}</p>}
              {w.company_website && <p className="text-xs text-slate-500">{w.company_website}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-extrabold tracking-wider text-amber-600">WARRANTY</span>
            <p className="text-xs font-semibold text-amber-700 mt-0.5 uppercase tracking-widest">Certificate</p>
            <p className="text-sm text-slate-600 mt-1 font-mono">{w.certificate_number}</p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <div className="flex-1 h-px bg-gradient-to-l from-amber-200 to-transparent" />
        </div>

        {/* Product & Customer info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Product Information</p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-2">
              {w.product_image_url && (
                <img src={w.product_image_url} alt="Product" className="w-full h-40 object-contain rounded-lg mb-3" />
              )}
              <div className="space-y-1.5">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-medium">Product Name</p>
                  <p className="text-sm font-semibold text-slate-800">{w.product_name || "—"}</p>
                </div>
                {w.product_model && (
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-medium">Model / SKU</p>
                    <p className="text-sm text-slate-700">{w.product_model}</p>
                  </div>
                )}
                {w.product_serial && (
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-medium">Serial Number</p>
                    <p className="text-sm text-slate-700 font-mono">{w.product_serial}</p>
                  </div>
                )}
                {w.product_description && (
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-medium">Description</p>
                    <p className="text-sm text-slate-600">{w.product_description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Customer Information</p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-1.5">
              <p className="font-semibold text-slate-900">{w.client_name || "—"}</p>
              {w.client_company && <p className="text-sm text-slate-600">{w.client_company}</p>}
              {w.client_address && <p className="text-sm text-slate-500">{w.client_address}</p>}
              {w.client_phone && <p className="text-sm text-slate-500">{w.client_phone}</p>}
              {w.client_email && <p className="text-sm text-slate-500">{w.client_email}</p>}
              {w.client_trn && <p className="text-sm text-slate-500">TRN: {w.client_trn}</p>}
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3 mt-6">Warranty Period</p>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase text-amber-600 font-medium">Issue Date</p>
                  <p className="font-semibold text-slate-800">{fmtDate(w.issue_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-amber-600 font-medium">Expiry Date</p>
                  <p className="font-semibold text-slate-800">{fmtDate(w.expiry_date)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase text-amber-600 font-medium">Duration</p>
                  <p className="font-semibold text-slate-800">
                    {w.warranty_duration || "—"} {w.warranty_duration_unit || "months"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms, Coverage, Exclusions */}
        <div className="space-y-6 mb-8">
          {w.coverage && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">What's Covered</p>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{w.coverage}</p>
              </div>
            </div>
          )}

          {w.exclusions && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Exclusions</p>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{w.exclusions}</p>
              </div>
            </div>
          )}

          {w.terms && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Terms & Conditions</p>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{w.terms}</p>
              </div>
            </div>
          )}
        </div>

        {/* Signature */}
        <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between items-end">
          <div className="text-xs text-slate-400">
            <p>Certificate #{w.certificate_number}</p>
            <p>Issued: {fmtDate(w.issue_date)}</p>
          </div>
          <div className="text-center">
            {w.stamp_url && <img src={w.stamp_url} alt="Stamp" className="w-28 h-28 object-contain mx-auto mb-2" />}
            {w.signature_url && <img src={w.signature_url} alt="Signature" className="w-48 h-16 object-contain mx-auto mb-1" />}
            {!w.signature_url && <div className="w-48 border-b border-slate-300 mb-1"></div>}
            <p className="text-xs text-slate-400">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
