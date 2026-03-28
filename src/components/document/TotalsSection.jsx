import React from "react";

export default function TotalsSection({ items, currency = "AED" }) {
  const sym = { AED: "AED ", USD: "$", EUR: "€", GBP: "£", ZAR: "R", NGN: "₦", KES: "KSh", INR: "₹" }[currency] || currency + " ";

  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const totalTax = items.reduce((s, i) => {
    const base = (i.quantity || 0) * (i.unit_price || 0);
    return s + base * ((i.tax_percent || 0) / 100);
  }, 0);
  const grandTotal = subtotal + totalTax;

  return (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
      <div className="space-y-2.5 max-w-xs ml-auto">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{sym}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Tax</span>
          <span>{sym}{totalTax.toFixed(2)}</span>
        </div>
        <div className="border-t border-slate-200 pt-2.5 flex justify-between text-lg font-bold text-slate-900">
          <span>Grand Total</span>
          <span>{sym}{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}