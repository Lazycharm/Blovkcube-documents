import React, { useState, useEffect } from "react";
import { getDocument } from "@/services/documents";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Printer, Pencil, Copy, Download } from "lucide-react";
import DocumentTemplate from "@/components/document/DocumentTemplate";

export default function DocumentPreview() {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get("id");
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (docId) {
      getDocument(docId).then((found) => {
        setDoc(found || null);
        setLoading(false);
      }).catch(() => {
        setDoc(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [docId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading document...</div>
      </div>
    );
  }

  const handleExportPDF = () => {
    const element = document.getElementById("document-preview");
    const opt = {
      margin: 0,
      filename: `${doc.document_number}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    import("html2pdf.js").then((m) => {
      const html2pdf = m.default;
      html2pdf().set(opt).from(element).save();
    });
  };

  if (!doc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Document not found</p>
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
            <Link to={createPageUrl("DocumentHistory")}>
              <Button variant="ghost" size="icon" className="text-slate-500">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold text-slate-900">{doc.document_number}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("CreateDocument") + `?type=${doc.type}&id=${doc.id}`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            </Link>
            <Link to={createPageUrl("CreateDocument") + `?type=${doc.type}&duplicate=${doc.id}`}>
              <Button variant="outline" size="sm">
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
              </Button>
            </Link>
            <Button size="sm" onClick={() => window.print()} variant="outline">
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
            </Button>
            <Button size="sm" onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:p-0">
        <DocumentTemplate doc={doc} />
      </div>
    </div>
  );
}