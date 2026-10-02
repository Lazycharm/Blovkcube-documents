import React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { uploadFile } from "@/services/storage";

import { Building2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CompanyInfo({ data, onChange }) {
  const handleField = (field, value) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      const publicUrl = await uploadFile(file);

      handleField("company_logo_url", publicUrl);
    } catch (err) {
      console.error("Logo upload failed:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Company Logo */}
      <div className="flex items-center gap-4">
        {data.company_logo_url ? (
          <img
            src={data.company_logo_url}
            alt="Logo"
            className="w-16 h-16 object-contain rounded-lg border border-slate-200"
          />
        ) : (
          <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
            <Building2 className="w-8 h-8 text-blue-300" />
          </div>
        )}

        <div>
          <label htmlFor="logo-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              asChild
            >
              <span>
                <Upload className="w-3 h-3 mr-1.5" />
                Upload Logo
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Company Name */}
        <div>
          <Label className="text-xs text-slate-500">Company Name</Label>

          <Input
            value={data.company_name || ""}
            onChange={(e) => handleField("company_name", e.target.value)}
            className="mt-1 border-slate-200"
          />
        </div>

        {/* Email */}
        <div>
          <Label className="text-xs text-slate-500">Email</Label>

          <Input
            type="email"
            value={data.company_email || ""}
            onChange={(e) => handleField("company_email", e.target.value)}
            className="mt-1 border-slate-200"
          />
        </div>

        {/* Phone */}
        <div>
          <Label className="text-xs text-slate-500">Phone</Label>

          <Input
            value={data.company_phone || ""}
            onChange={(e) => handleField("company_phone", e.target.value)}
            className="mt-1 border-slate-200"
          />
        </div>

        {/* TRN */}
        <div>
          <Label className="text-xs text-slate-500">TRN</Label>

          <Input
            value={data.company_trn || ""}
            onChange={(e) => handleField("company_trn", e.target.value)}
            placeholder="100XXXXXXXXXXXXX"
            className="mt-1 border-slate-200"
          />
        </div>

        {/* Website */}
        <div>
          <Label className="text-xs text-slate-500">Website</Label>

          <Input
            value={data.company_website || ""}
            onChange={(e) => handleField("company_website", e.target.value)}
            className="mt-1 border-slate-200"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Label className="text-xs text-slate-500">Address</Label>

          <Input
            value={data.company_address || ""}
            onChange={(e) => handleField("company_address", e.target.value)}
            className="mt-1 border-slate-200"
          />
        </div>
      </div>
    </div>
  );
}
