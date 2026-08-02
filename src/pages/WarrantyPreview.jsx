import React, { useState, useEffect } from "react";
import { getWarranty } from "@/services/warranties";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { exportHtmlToPdf } from "@/utils/pdfExport";
import { ArrowLeft, Printer, Pencil, Copy, Download } from "lucide-react";
import WarrantyTemplate from "@/components/warranty/WarrantyTemplate";

export default function WarrantyPreview() {
  const urlParams = new URLSearchParams(window.location.search);
  const wId = urlParams.get("id");
  const [warranty, setWarranty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wId) {
      getWarranty(wId).then((found) => {
        setWarranty(found || null);
        setLoading(false);
      }).catch(() => {
        setWarranty(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [wId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading certificate...</div>
      </div>
    );
  }

  const handleExportPDF = async () => {
    const element = document.getElementById("warranty-preview");
    if (!element) return;
    try {
      await exportHtmlToPdf(element, `${warranty.certificate_number}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Try again or use Print → Save as PDF.");
    }
  };

  if (!warranty) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Certificate not found</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("WarrantyHistory")}>
              <Button variant="ghost" size="icon" className="text-slate-500" aria-label="Back to Warranty History">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-slate-900">{warranty.certificate_number}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("CreateWarranty") + `?id=${warranty.id}`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            </Link>
            <Link to={createPageUrl("CreateWarranty") + `?duplicate=${warranty.id}`}>
              <Button variant="outline" size="sm">
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
              </Button>
            </Link>
            <Button size="sm" onClick={() => window.print()} variant="outline">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <Button size="sm" onClick={handleExportPDF} className="bg-amber-600 hover:bg-amber-700">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:p-0">
        <WarrantyTemplate warranty={warranty} />
      </div>

      <div className="hidden print:block">
        <WarrantyTemplate warranty={warranty} />
      </div>
    </div>
  );
}
