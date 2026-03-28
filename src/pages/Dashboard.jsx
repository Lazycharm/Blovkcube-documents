import React, { useState } from "react";
import { listDocuments, updateDocument } from "@/services/documents";
import { listClients, createClient, updateClient, deleteClient } from "@/services/clients";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, differenceInDays, startOfDay } from "date-fns";
import {
  FileText, ClipboardList, Receipt, Plus, ArrowRight,
  TrendingUp, Clock, CheckCircle2, Building2, ShieldCheck,
  Users, Pencil, Trash2, X, AlertTriangle
} from "lucide-react";

const typeConfig = {
  invoice: { label: "Tax Invoice", color: "bg-blue-100 text-blue-700", accent: "bg-blue-600", lightBg: "bg-blue-50", icon: FileText },
  quotation: { label: "Quote", color: "bg-violet-100 text-violet-700", accent: "bg-violet-600", lightBg: "bg-violet-50", icon: ClipboardList },
  receipt: { label: "Receipt", color: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-600", lightBg: "bg-emerald-50", icon: Receipt },
};

const emptyClient = { name: "", company: "", address: "", phone: "", email: "", trn: "" };

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [clientSaving, setClientSaving] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(200),
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
  });

  const openAddClient = () => {
    setEditingClient(null);
    setClientForm(emptyClient);
    setClientDialogOpen(true);
  };

  const openEditClient = (client) => {
    setEditingClient(client);
    setClientForm({ name: client.name || "", company: client.company || "", address: client.address || "", phone: client.phone || "", email: client.email || "", trn: client.trn || "" });
    setClientDialogOpen(true);
  };

  const handleSaveClient = async () => {
    if (!clientForm.name.trim()) return;
    setClientSaving(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientForm);
      } else {
        await createClient(clientForm);
      }
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setClientDialogOpen(false);
    } catch (err) {
      console.error("Failed to save client:", err);
    } finally {
      setClientSaving(false);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await deleteClient(id);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  const invoices = documents.filter((d) => d.type === "invoice");
  const quotations = documents.filter((d) => d.type === "quotation");
  const receipts = documents.filter((d) => d.type === "receipt");
  const totalRevenue = documents.reduce((s, d) => s + (d.grand_total || 0), 0);
  const paid = documents.filter((d) => d.status === "paid");
  const pending = documents.filter((d) => d.status === "draft" || d.status === "sent");
  const recent = documents.slice(0, 5);

  const today = startOfDay(new Date());
  const reminders = documents
    .filter((d) => d.due_date && d.status !== "paid" && d.status !== "cancelled")
    .map((d) => {
      const due = startOfDay(new Date(d.due_date));
      const daysLeft = differenceInDays(due, today);
      return { ...d, daysLeft };
    })
    .filter((d) => d.daysLeft <= 2)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const handleMarkStatus = async (id, status) => {
    try {
      await updateDocument(id, { status });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b15319d48f2711d4d14365/e700388e1_cropped-logo-1.png" alt="Blockcube" className="w-10 h-10 object-contain rounded-xl" />
                <h1 className="text-2xl font-bold text-slate-900">Blockcube</h1>
              </div>
              <p className="text-slate-500 text-sm ml-[52px]">Tax Invoice, Quotation, Receipt & Warranty Builder</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl("WarrantyHistory")}>
                <Button variant="outline" className="text-sm">
                  Warranties <ShieldCheck className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to={createPageUrl("DocumentHistory")}>
                <Button variant="outline" className="text-sm">
                  Documents <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Quick Create */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Create New</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: "invoice", title: "Tax Invoice", desc: "Bill your clients", icon: FileText, gradient: "from-blue-500 to-blue-700" },
              { type: "quotation", title: "Quotation", desc: "Send a quote", icon: ClipboardList, gradient: "from-violet-500 to-violet-700" },
              { type: "receipt", title: "Receipt", desc: "Confirm payment", icon: Receipt, gradient: "from-emerald-500 to-emerald-700" },
            ].map((item) => (
              <Link key={item.type} to={createPageUrl("CreateDocument") + `?type=${item.type}`}>
                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden">
                  <div className={`bg-gradient-to-br ${item.gradient} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <item.icon className="w-8 h-8 mb-3 opacity-90" />
                        <h3 className="text-lg font-bold">{item.title}</h3>
                        <p className="text-sm opacity-80">{item.desc}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            <Link to={createPageUrl("CreateWarranty")}>
              <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden">
                <div className="bg-gradient-to-br from-amber-500 to-orange-700 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <ShieldCheck className="w-8 h-8 mb-3 opacity-90" />
                      <h3 className="text-lg font-bold">Warranty</h3>
                      <p className="text-sm opacity-80">Issue certificate</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Documents", value: documents.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Paid", value: paid.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Pending", value: pending.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat) => (
            <Card key={stat.label} className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Document type breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Tax Invoices", count: invoices.length, total: invoices.reduce((s, d) => s + (d.grand_total || 0), 0), icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Quotations", count: quotations.length, total: quotations.reduce((s, d) => s + (d.grand_total || 0), 0), icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Receipts", count: receipts.length, total: receipts.reduce((s, d) => s + (d.grand_total || 0), 0), icon: Receipt, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((item) => (
            <Card key={item.label} className="border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{item.count}</p>
                    <p className="text-xs text-slate-500 mt-1">${item.total.toFixed(2)} total</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reminders */}
        {reminders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Reminders
            </h2>
            <div className="space-y-2">
              {reminders.map((doc) => {
                const tc = typeConfig[doc.type] || typeConfig.invoice;
                const Icon = tc.icon;
                const isExpired = doc.daysLeft < 0;
                const isToday = doc.daysLeft === 0;
                const urgencyBg = isExpired ? "bg-red-50 border-red-200" : isToday ? "bg-orange-50 border-orange-200" : "bg-amber-50 border-amber-200";
                const urgencyText = isExpired
                  ? `Expired ${Math.abs(doc.daysLeft)} day${Math.abs(doc.daysLeft) !== 1 ? "s" : ""} ago`
                  : isToday
                  ? "Due today"
                  : `${doc.daysLeft} day${doc.daysLeft !== 1 ? "s" : ""} remaining`;
                const urgencyColor = isExpired ? "text-red-600" : isToday ? "text-orange-600" : "text-amber-600";

                return (
                  <Card key={doc.id} className={`${urgencyBg} shadow-sm`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${tc.lightBg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${tc.color.split(" ")[1]}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-slate-800">{doc.document_number}</p>
                            <Badge variant="secondary" className={`${tc.color} text-[10px] font-medium`}>{tc.label}</Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {doc.client_name || "No client"} &bull; Due: {format(new Date(doc.due_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold ${urgencyColor}`}>{urgencyText}</span>
                        <Button size="sm" variant="outline" className="text-xs h-7 bg-white" onClick={() => handleMarkStatus(doc.id, "paid")}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                        </Button>
                        <Link to={createPageUrl("CreateDocument") + `?id=${doc.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs h-7">
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Documents</h2>
            <Link to={createPageUrl("DocumentHistory")} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>

          {isLoading ? (
            <Card className="p-8 text-center text-slate-400 border-slate-200">Loading...</Card>
          ) : recent.length === 0 ? (
            <Card className="p-12 text-center border-slate-200 border-dashed">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1">No documents yet</p>
              <p className="text-xs text-slate-400">Create your first tax invoice, quotation, or receipt above</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recent.map((doc) => {
                const tc = typeConfig[doc.type] || typeConfig.invoice;
                const Icon = tc.icon;
                return (
                  <Link key={doc.id} to={createPageUrl("DocumentPreview") + `?id=${doc.id}`}>
                    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mb-2">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${tc.lightBg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${tc.color.split(" ")[1]}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-slate-800">{doc.document_number}</p>
                              <Badge variant="secondary" className={`${tc.color} text-[10px] font-medium`}>{tc.label}</Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              {doc.client_name || "No client"} • {doc.issue_date ? format(new Date(doc.issue_date), "MMM dd, yyyy") : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-slate-800">
                            ${(doc.grand_total || 0).toFixed(2)}
                          </p>
                          <Badge variant="secondary" className={`text-[10px] capitalize ${
                            doc.status === "paid" ? "bg-green-100 text-green-700" :
                            doc.status === "sent" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {doc.status || "draft"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Clients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Clients</h2>
            <Button size="sm" variant="outline" className="text-sm" onClick={openAddClient}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Client
            </Button>
          </div>

          {clientsLoading ? (
            <Card className="p-8 text-center text-slate-400 border-slate-200">Loading...</Card>
          ) : clients.length === 0 ? (
            <Card className="p-12 text-center border-slate-200 border-dashed">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-1">No clients yet</p>
              <p className="text-xs text-slate-400 mb-4">Add clients to quickly fill them in when creating documents</p>
              <Button size="sm" onClick={openAddClient}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Your First Client
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clients.map((client) => (
                <Card key={client.id} className="border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-slate-800 truncate">{client.name}</p>
                        {client.company && <p className="text-xs text-slate-500 truncate">{client.company}</p>}
                        {client.email && <p className="text-xs text-slate-400 truncate mt-1">{client.email}</p>}
                        {client.phone && <p className="text-xs text-slate-400">{client.phone}</p>}
                        {client.trn && <p className="text-xs text-slate-400">TRN: {client.trn}</p>}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => openEditClient(client)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={() => handleDeleteClient(client.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Client Add/Edit Dialog */}
        <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-slate-500">Name *</Label>
                <Input value={clientForm.name} onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="Client name" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Company</Label>
                <Input value={clientForm.company} onChange={(e) => setClientForm((f) => ({ ...f, company: e.target.value }))} className="mt-1" placeholder="Company name" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Email</Label>
                <Input value={clientForm.email} onChange={(e) => setClientForm((f) => ({ ...f, email: e.target.value }))} className="mt-1" placeholder="email@example.com" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Phone</Label>
                <Input value={clientForm.phone} onChange={(e) => setClientForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="+971..." />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Address</Label>
                <Input value={clientForm.address} onChange={(e) => setClientForm((f) => ({ ...f, address: e.target.value }))} className="mt-1" placeholder="Full address" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">TRN</Label>
                <Input value={clientForm.trn} onChange={(e) => setClientForm((f) => ({ ...f, trn: e.target.value }))} className="mt-1" placeholder="Tax Registration Number" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setClientDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveClient} disabled={clientSaving || !clientForm.name.trim()}>
                {clientSaving ? "Saving..." : editingClient ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}