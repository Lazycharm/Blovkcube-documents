import React, { useState } from "react";
import { listWarranties, deleteWarranty } from "@/services/warranties";
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
  ArrowLeft, Search, MoreHorizontal, Pencil, Copy, Trash2, Printer, ShieldCheck
} from "lucide-react";

const statusConfig = {
  active: "bg-green-100 text-green-700",
  expired: "bg-amber-100 text-amber-700",
  voided: "bg-red-100 text-red-700",
  claimed: "bg-blue-100 text-blue-700",
};

export default function WarrantyHistory() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ["warranties"],
    queryFn: () => listWarranties(200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteWarranty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warranties"] }),
  });

  const filtered = warranties.filter((w) => {
    const matchSearch = !search ||
      w.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      w.certificate_number?.toLowerCase().includes(search.toLowerCase()) ||
      w.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      w.product_serial?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || w.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("Dashboard")}>
                <Button variant="ghost" size="icon" className="text-slate-500" aria-label="Back to Dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Warranty Certificates</h1>
                <p className="text-sm text-slate-500">{warranties.length} certificates</p>
              </div>
            </div>
            <Link to={createPageUrl("CreateWarranty")}>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> New Certificate
              </Button>
            </Link>
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
                placeholder="Search by client, certificate #, product..."
                className="pl-9 border-slate-200"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
                <SelectItem value="claimed">Claimed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Loading certificates...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>No warranty certificates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-semibold">Certificate #</TableHead>
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Issue Date</TableHead>
                    <TableHead className="font-semibold">Expiry Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((w) => (
                    <TableRow key={w.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-sm font-medium text-slate-800">{w.certificate_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-slate-800">{w.product_name || "—"}</p>
                          {w.product_serial && <p className="text-xs text-slate-500 font-mono">{w.product_serial}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-slate-800">{w.client_name || "—"}</p>
                          {w.client_company && <p className="text-xs text-slate-500">{w.client_company}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {w.issue_date ? format(new Date(w.issue_date), "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {w.expiry_date ? format(new Date(w.expiry_date), "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${statusConfig[w.status] || statusConfig.active} text-xs capitalize`}>
                          {w.status || "active"}
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
                              <Link to={createPageUrl("CreateWarranty") + `?id=${w.id}`}>
                                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("CreateWarranty") + `?duplicate=${w.id}`}>
                                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl("WarrantyPreview") + `?id=${w.id}`}>
                                <Printer className="w-3.5 h-3.5 mr-2" /> View / Print
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(w.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
