import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { updateCompany, listTeam, getMySubscription } from "@/services/companies";
import { uploadFile } from "@/services/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Building2, Upload, Loader2, Users, CreditCard } from "lucide-react";

export default function CompanySettings() {
  const { company, refreshCompany } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [team, setTeam] = useState([]);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "",
        address: company.address || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        logo_url: company.logo_url || "",
        bank_details: company.bank_details || "",
        trn: company.trn || "",
      });
    }
  }, [company]);

  useEffect(() => {
    if (!company?.id) return;
    listTeam(company.id).then(setTeam).catch((err) => console.error("Failed to load team:", err));
    getMySubscription(company.id).then(setSubscription).catch((err) => console.error("Failed to load subscription:", err));
  }, [company?.id]);

  const handleField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFile(file);
      handleField("logo_url", publicUrl);
    } catch (err) {
      console.error("Logo upload failed:", err);
    }
  };

  const handleSave = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      await updateCompany(company.id, form);
      await refreshCompany();
      setSaved(true);
    } catch (err) {
      console.error("Failed to save company:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!company || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="icon" aria-label="Back to Dashboard"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Company Settings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Company Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-slate-200" />
              ) : (
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <Building2 className="w-8 h-8 text-blue-300" />
                </div>
              )}
              <label htmlFor="logo-upload">
                <Button type="button" variant="outline" size="sm" className="text-xs" asChild>
                  <span>
                    <Upload className="w-3 h-3 mr-1.5" /> Upload Logo
                    <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </span>
                </Button>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">Company Name</Label>
                <Input value={form.name} onChange={(e) => handleField("name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Email</Label>
                <Input value={form.email} onChange={(e) => handleField("email", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Phone</Label>
                <Input value={form.phone} onChange={(e) => handleField("phone", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Website</Label>
                <Input value={form.website} onChange={(e) => handleField("website", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">TRN</Label>
                <Input value={form.trn} onChange={(e) => handleField("trn", e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-slate-500">Address</Label>
                <Input value={form.address} onChange={(e) => handleField("address", e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-slate-500">Bank Details (shown on invoices)</Label>
                <Textarea value={form.bank_details} onChange={(e) => handleField("bank_details", e.target.value)} className="mt-1" rows={4} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
              {saved && <span className="text-sm text-emerald-600">Saved</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {team.length === 0 ? (
              <p className="text-sm text-slate-400">No team members found.</p>
            ) : (
              team.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700 font-mono">{member.user_id}</span>
                  <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700 capitalize">{subscription?.plan || "free"} plan</p>
              <p className="text-xs text-slate-400 capitalize">{subscription?.status || "active"}</p>
            </div>
            {(!subscription || subscription.plan === "free") && (
              <Button size="sm" variant="outline" onClick={() => navigate(createPageUrl("Subscribe"))}>Upgrade to Pro</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
