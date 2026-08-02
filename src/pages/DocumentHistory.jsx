import React, { useState } from "react";
import { listDocuments, deleteDocument } from "@/services/documents";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  ArrowLeft, Search, MoreHorizontal, Pencil, Copy, Trash2, Printer,
  FileText, Receipt, ClipboardList
} from "lucide-react";

const typeConfig = {
  invoice: { label: "Tax Invoice", color: "bg-blue-100 text-blue-700", icon: FileText },
  quotation: { label: "Quote", color: "bg-violet-100 text-violet-700", icon: ClipboardList },
  receipt: { label: "Receipt", color: "bg-emerald-100 text-emerald-700", icon: Receipt },
};

const statusConfig = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  expired: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DocumentHistory() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const sym = (currency) => ({ AED: "AED ", USD: "$", EUR: "€", GBP: "£", ZAR: "R", NGN: "₦", KES: "KSh", INR: "₹" }[currency] || currency + " ");

  const filtered = documents.filter((d) => {
    const matchSearch = !search || d.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.document_number?.toLowerCase().includes(search.toLowerCase()) ||
      d.client_company?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || d.type === filterType;
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="icon" className="text-slate-500" aria-label="Back to Dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Document History</h1>
              <p className="text-sm text-slate-500">{documents.length} documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <Card className="p-4 mb-6 border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client, number..."
                className="pl-9 border-slate-200"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Tax Invoices</SelectItem>
                <SelectItem value="quotation">Quotations</SelectItem>
                <SelectItem value="receipt">Receipts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Loading documents...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-semibold">Number</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => {
                    const tc = typeConfig[doc.type] || typeConfig.invoice;
                    const Icon = tc.icon;
                    return (
                      <TableRow key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-mono text-sm font-medium text-slate-800">{doc.document_number}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${tc.color} text-xs font-medium`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {tc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{doc.client_name}</p>
                            {doc.client_company && <p className="text-xs text-slate-500">{doc.client_company}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {doc.issue_date ? format(new Date(doc.issue_date), "MMM dd, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {sym(doc.currency)}{(doc.grand_total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${statusConfig[doc.status] || statusConfig.draft} text-xs capitalize`}>
                            {doc.status || "draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" aria-label="More actions">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={createPageUrl("CreateDocument") + `?type=${doc.type}&id=${doc.id}`}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={createPageUrl("CreateDocument") + `?type=${doc.type}&duplicate=${doc.id}`}>
                                  <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={createPageUrl("DocumentPreview") + `?id=${doc.id}`}>
                                  <Printer className="w-3.5 h-3.5 mr-2" /> View / Print
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(doc.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}