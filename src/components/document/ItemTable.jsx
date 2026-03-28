import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

const EMPTY_ITEM = {
  description: "",
  image_url: "",
  image_url_2: "",
  image_url_3: "",
  quantity: 1,
  unit_price: 0,
  tax_percent: 0,
  total: 0,
};

function calcItemTotal(item) {
  const base = (item.quantity || 0) * (item.unit_price || 0);
  const tax = base * ((item.tax_percent || 0) / 100);
  return Math.max(0, base + tax);
}

export default function ItemTable({ items, onChange, currency = "AED", docType = "invoice" }) {
  const sym = { AED: "AED ", USD: "$", EUR: "€", GBP: "£", ZAR: "R", NGN: "₦", KES: "KSh", INR: "₹" }[currency] || currency + " ";

  /** Parent must accept array or updater fn (see CreateDocument) so async image uploads merge correctly */
  const setItems = (itemsOrUpdater) => onChange(itemsOrUpdater);

  const updateItem = (index, field, value) => {
    setItems((prevItems) => {
      const prev = prevItems || [];
      return prev.map((item, i) => {
        if (i !== index) return item;
        const newItem = { ...item, [field]: value };
        newItem.total = calcItemTotal(newItem);
        return newItem;
      });
    });
  };

  const addItem = () => setItems((prevItems) => [...(prevItems || []), { ...EMPTY_ITEM }]);
  const removeItem = (index) => setItems((prevItems) => (prevItems || []).filter((_, i) => i !== index));
  const isQuotation = docType === "quotation";

  const handleItemImageUpload = (index, slot, file, inputEl) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const field =
      Number(slot) === 3 ? "image_url_3" : Number(slot) === 2 ? "image_url_2" : "image_url";
    const reader = new FileReader();
    reader.onload = () => {
      updateItem(index, field, reader.result);
      if (inputEl) inputEl.value = "";
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-1 text-center">Qty</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-1 text-center">Tax %</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1"></div>
      </div>

      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-50/50 rounded-lg p-3 md:p-2 border border-slate-100">
          <div className="md:col-span-1 flex items-center justify-center gap-2">
            <label className="md:hidden text-xs text-slate-500">#</label>
            <span className="text-sm font-semibold text-slate-600 tabular-nums">{index + 1}</span>
          </div>
          <div className="md:col-span-4">
            <label className="md:hidden text-xs text-slate-500 mb-1 block">Description</label>
            <Input
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              placeholder="Item description"
              className="bg-white border-slate-200 text-sm"
            />
            {isQuotation && (
              <div className="mt-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Image 1</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleItemImageUpload(index, 1, e.target.files?.[0], e.target)}
                    className="bg-white border-slate-200 text-sm"
                  />
                  {item.image_url && (
                    <div className="flex items-center gap-2">
                      <img src={item.image_url} alt="Item 1" className="w-14 h-14 rounded border border-slate-200 object-cover bg-white" />
                      <Button type="button" variant="outline" size="sm" onClick={() => updateItem(index, "image_url", "")}>
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Image 2</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleItemImageUpload(index, 2, e.target.files?.[0], e.target)}
                    className="bg-white border-slate-200 text-sm"
                  />
                  {item.image_url_2 && (
                    <div className="flex items-center gap-2">
                      <img src={item.image_url_2} alt="Item 2" className="w-14 h-14 rounded border border-slate-200 object-cover bg-white" />
                      <Button type="button" variant="outline" size="sm" onClick={() => updateItem(index, "image_url_2", "")}>
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Image 3</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleItemImageUpload(index, 3, e.target.files?.[0], e.target)}
                    className="bg-white border-slate-200 text-sm"
                  />
                  {item.image_url_3 && (
                    <div className="flex items-center gap-2">
                      <img src={item.image_url_3} alt="Item 3" className="w-14 h-14 rounded border border-slate-200 object-cover bg-white" />
                      <Button type="button" variant="outline" size="sm" onClick={() => updateItem(index, "image_url_3", "")}>
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-1">
            <label className="md:hidden text-xs text-slate-500 mb-1 block">Qty</label>
            <Input
              type="number"
              min="0"
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
              className="bg-white border-slate-200 text-sm text-center"
            />
          </div>
          <div className="md:col-span-2">
            <label className="md:hidden text-xs text-slate-500 mb-1 block">Unit Price</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price}
              onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
              className="bg-white border-slate-200 text-sm text-right"
            />
          </div>
          <div className="md:col-span-1">
            <label className="md:hidden text-xs text-slate-500 mb-1 block">Tax %</label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={item.tax_percent}
              onChange={(e) => updateItem(index, "tax_percent", parseFloat(e.target.value) || 0)}
              className="bg-white border-slate-200 text-sm text-center"
            />
          </div>
          <div className="md:col-span-2 text-right font-medium text-sm text-slate-800">
            <label className="md:hidden text-xs text-slate-500 mb-1 block">Total</label>
            {sym}{item.total.toFixed(2)}
          </div>
          <div className="md:col-span-1 flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addItem} className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300">
        <Plus className="w-4 h-4 mr-2" /> Add Item
      </Button>
    </div>
  );
}