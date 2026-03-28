import React, { useState, useEffect } from "react";
import { getWarranty, createWarranty, updateWarranty, getNextWarrantyNumber } from "@/services/warranties";
import { listClients, createClient } from "@/services/clients";
import { uploadFile } from "@/services/storage";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, Save, Printer, Download, ShieldCheck, Upload } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";
import { createPageUrl } from "@/utils";
import { exportHtmlToPdf } from "@/utils/pdfExport";
import { Link } from "react-router-dom";

import ClientSelector from "@/components/document/ClientSelector";
import CompanyInfo from "@/components/document/CompanyInfo";
import WarrantyTemplate from "@/components/warranty/WarrantyTemplate";

export default function CreateWarranty() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("id");
  const duplicateId = urlParams.get("duplicate");

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("edit");
  const [saving, setSaving] = useState(false);

  const [warranty, setWarranty] = useState({
    certificate_number: "WRC-00001",
    status: "active",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    expiry_date: "",
    warranty_duration: 12,
    warranty_duration_unit: "months",
    product_name: "",
    product_model: "",
    product_serial: "",
    product_description: "",
    product_image_url: "",
    client_name: "",
    client_company: "",
    client_address: "",
    client_phone: "",
    client_email: "",
    client_trn: "",
    company_name: "Blovk Cube Ts Est",
    company_address: "Khaled building Hor Al Anz Office F1-457 | TRN 104745825000003",
    company_phone: "+97156592122,+971543873531",
    company_email: "blovkcubetsest@gmail.com",
    company_website: "https://blovkcube.com/",
    company_logo_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b15319d48f2711d4d14365/e700388e1_cropped-logo-1.png",
    terms: "",
    coverage: "",
    exclusions: "",
    stamp_url: "",
    signature_url: "",
  });

  useEffect(() => {
    const loadId = editId || duplicateId;
    if (loadId) {
      getWarranty(loadId).then((found) => {
        if (found) {
          const loaded = { ...found };
          if (duplicateId) {
            delete loaded.id;
            loaded.status = "active";
            loaded.issue_date = format(new Date(), "yyyy-MM-dd");
            getNextWarrantyNumber().then((num) => {
              loaded.certificate_number = num;
              setWarranty(loaded);
            });
            return;
          }
          setWarranty(loaded);
        }
      }).catch(() => {});
    } else {
      getNextWarrantyNumber().then((num) => {
        setWarranty((prev) => ({ ...prev, certificate_number: num }));
      }).catch(() => {});
    }
  }, [editId, duplicateId]);

  const updateW = (updates) => setWarranty((prev) => ({ ...prev, ...updates }));

  // Auto-calculate expiry when issue date or duration changes
  const calcExpiry = (issueDate, duration, unit) => {
    if (!issueDate || !duration) return "";
    const base = new Date(issueDate);
    if (unit === "years") return format(addYears(base, duration), "yyyy-MM-dd");
    return format(addMonths(base, duration), "yyyy-MM-dd");
  };

  const handleDurationChange = (duration, unit) => {
    const d = parseInt(duration, 10) || 0;
    const u = unit || warranty.warranty_duration_unit;
    updateW({
      warranty_duration: d,
      warranty_duration_unit: u,
      expiry_date: calcExpiry(warranty.issue_date, d, u),
    });
  };

  const handleIssueDateChange = (date) => {
    updateW({
      issue_date: date,
      expiry_date: calcExpiry(date, warranty.warranty_duration, warranty.warranty_duration_unit),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...warranty };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    if (warranty.client_name) {
      try {
        const existingClients = await listClients();
        const exists = existingClients.find((c) => c.name === warranty.client_name && c.company === warranty.client_company);
        if (!exists) {
          await createClient({
            name: warranty.client_name,
            company: warranty.client_company,
            address: warranty.client_address,
            phone: warranty.client_phone,
            email: warranty.client_email,
          });
        }
      } catch (err) {
        console.error("Failed to save client:", err);
      }
    }

    try {
      if (editId) {
        await updateWarranty(editId, payload);
      } else {
        await createWarranty(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      window.location.href = createPageUrl("WarrantyHistory");
    } catch (err) {
      console.error("Failed to save warranty:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    setActiveTab("preview");
    setTimeout(() => window.print(), 300);
  };

  const handleExportPDF = () => {
    setActiveTab("preview");
    setTimeout(async () => {
      const element = document.getElementById("warranty-preview");
      if (!element) return;
      try {
        await exportHtmlToPdf(element, `${warranty.certificate_number}.pdf`);
      } catch (err) {
        console.error("PDF export failed:", err);
        alert("Failed to export PDF. Try again or use Print → Save as PDF.");
      }
    }, 400);
  };

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
                {editId ? "Edit" : "New"} <span className="text-amber-600">Warranty Certificate</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">{warranty.certificate_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
              <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 print:p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
          <TabsList className="bg-white border border-slate-200 mb-6">
            <TabsTrigger value="edit"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Edit</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="w-3.5 h-3.5 mr-1.5" /> Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <div className="space-y-6">
              {/* Company Info */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompanyInfo data={warranty} onChange={(d) => updateW(d)} />
                </CardContent>
              </Card>

              {/* Client + Certificate Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClientSelector clientData={warranty} onChange={(d) => updateW(d)} />
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Certificate Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-slate-500">Certificate Number</Label>
                      <Input value={warranty.certificate_number} onChange={(e) => updateW({ certificate_number: e.target.value })} className="mt-1 border-slate-200 font-mono text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Issue Date</Label>
                      <Input type="date" value={warranty.issue_date} onChange={(e) => handleIssueDateChange(e.target.value)} className="mt-1 border-slate-200" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-500">Warranty Duration</Label>
                        <Input type="number" min="1" value={warranty.warranty_duration} onChange={(e) => handleDurationChange(e.target.value, warranty.warranty_duration_unit)} className="mt-1 border-slate-200" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Unit</Label>
                        <Select value={warranty.warranty_duration_unit} onValueChange={(v) => handleDurationChange(warranty.warranty_duration, v)}>
                          <SelectTrigger className="mt-1 border-slate-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Expiry Date</Label>
                      <Input type="date" value={warranty.expiry_date} onChange={(e) => updateW({ expiry_date: e.target.value })} className="mt-1 border-slate-200" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Status</Label>
                      <Select value={warranty.status} onValueChange={(v) => updateW({ status: v })}>
                        <SelectTrigger className="mt-1 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="voided">Voided</SelectItem>
                          <SelectItem value="claimed">Claimed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Product Information */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500">Product Name *</Label>
                      <Input value={warranty.product_name} onChange={(e) => updateW({ product_name: e.target.value })} placeholder="Product name" className="mt-1 border-slate-200" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Model / SKU</Label>
                      <Input value={warranty.product_model} onChange={(e) => updateW({ product_model: e.target.value })} placeholder="Model number" className="mt-1 border-slate-200" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Serial Number</Label>
                      <Input value={warranty.product_serial} onChange={(e) => updateW({ product_serial: e.target.value })} placeholder="Serial number" className="mt-1 border-slate-200" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Product Description</Label>
                    <Textarea value={warranty.product_description} onChange={(e) => updateW({ product_description: e.target.value })} placeholder="Describe the product..." rows={2} className="mt-1 border-slate-200" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-2 block">Product Image</Label>
                    <div className="flex items-center gap-4">
                      {warranty.product_image_url ? (
                        <img src={warranty.product_image_url} alt="Product" className="w-24 h-24 object-contain rounded-lg border border-slate-200" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-xs">No image</div>
                      )}
                      <label>
                        <Button type="button" variant="outline" size="sm" className="text-xs" asChild>
                          <span>
                            <Upload className="w-3 h-3 mr-1.5" /> Upload Image
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; try { const url = await uploadFile(file); updateW({ product_image_url: url }); } catch (err) { console.error("Upload failed:", err); } }} />
                          </span>
                        </Button>
                      </label>
                      {warranty.product_image_url && <Button type="button" variant="ghost" size="sm" className="text-xs text-red-500" onClick={() => updateW({ product_image_url: "" })}>Remove</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coverage & Terms */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Coverage & Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500">What's Covered</Label>
                      <Textarea value={warranty.coverage || ""} onChange={(e) => updateW({ coverage: e.target.value })} placeholder="Describe what the warranty covers..." rows={4} className="mt-1 border-slate-200" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Exclusions</Label>
                      <Textarea value={warranty.exclusions || ""} onChange={(e) => updateW({ exclusions: e.target.value })} placeholder="What is NOT covered..." rows={4} className="mt-1 border-slate-200" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Terms & Conditions</Label>
                      <Textarea value={warranty.terms || ""} onChange={(e) => updateW({ terms: e.target.value })} placeholder="Terms and conditions..." rows={4} className="mt-1 border-slate-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stamp & Signature */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Stamp & Signature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">Company Stamp</Label>
                      <div className="flex items-center gap-4">
                        {warranty.stamp_url ? (
                          <img src={warranty.stamp_url} alt="Stamp" className="w-24 h-24 object-contain rounded-lg border border-slate-200" />
                        ) : (
                          <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-xs">No stamp</div>
                        )}
                        <label>
                          <Button type="button" variant="outline" size="sm" className="text-xs" asChild>
                            <span>
                              <Upload className="w-3 h-3 mr-1.5" /> Upload Stamp
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; try { const url = await uploadFile(file); updateW({ stamp_url: url }); } catch (err) { console.error("Stamp upload failed:", err); } }} />
                            </span>
                          </Button>
                        </label>
                        {warranty.stamp_url && <Button type="button" variant="ghost" size="sm" className="text-xs text-red-500" onClick={() => updateW({ stamp_url: "" })}>Remove</Button>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">Signature</Label>
                      <div className="flex items-center gap-4">
                        {warranty.signature_url ? (
                          <img src={warranty.signature_url} alt="Signature" className="h-16 object-contain rounded-lg border border-slate-200" />
                        ) : (
                          <div className="w-48 h-16 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-xs">No signature</div>
                        )}
                        <label>
                          <Button type="button" variant="outline" size="sm" className="text-xs" asChild>
                            <span>
                              <Upload className="w-3 h-3 mr-1.5" /> Upload Signature
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; try { const url = await uploadFile(file); updateW({ signature_url: url }); } catch (err) { console.error("Signature upload failed:", err); } }} />
                            </span>
                          </Button>
                        </label>
                        {warranty.signature_url && <Button type="button" variant="ghost" size="sm" className="text-xs text-red-500" onClick={() => updateW({ signature_url: "" })}>Remove</Button>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <WarrantyTemplate warranty={warranty} />
          </TabsContent>
        </Tabs>

        {/* Print-only preview */}
        <div className="hidden print:block">
          <WarrantyTemplate warranty={warranty} />
        </div>
      </div>
    </div>
  );
}
