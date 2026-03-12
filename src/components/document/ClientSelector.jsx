import React, { useState } from "react";
import { listClients } from "@/services/clients";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users } from "lucide-react";

export default function ClientSelector({ clientData, onChange }) {
  const [mode, setMode] = useState("new");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(100),
  });

  const selectClient = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      onChange({
        client_name: client.name || "",
        client_company: client.company || "",
        client_address: client.address || "",
        client_phone: client.phone || "",
        client_email: client.email || "",
        client_trn: client.trn || "",
      });
    }
};

  const handleField = (field, value) => {
    onChange({ ...clientData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("new")}
          className={mode === "new" ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" /> New Client
        </Button>
        <Button
          type="button"
          variant={mode === "existing" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("existing")}
          className={mode === "existing" ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          <Users className="w-3.5 h-3.5 mr-1.5" /> Existing Client
        </Button>
      </div>

      {mode === "existing" && clients.length > 0 && (
        <Select onValueChange={selectClient}>
          <SelectTrigger className="border-slate-200">
            <SelectValue placeholder="Select a client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.company ? `(${c.company})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-500">Client Name *</Label>
          <Input value={clientData.client_name || ""} onChange={(e) => handleField("client_name", e.target.value)} placeholder="John Doe" className="mt-1 border-slate-200" />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Company</Label>
          <Input value={clientData.client_company || ""} onChange={(e) => handleField("client_company", e.target.value)} placeholder="Acme Corp" className="mt-1 border-slate-200" />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Email</Label>
          <Input value={clientData.client_email || ""} onChange={(e) => handleField("client_email", e.target.value)} placeholder="john@acme.com" className="mt-1 border-slate-200" />
        </div>
        <div>
          <Label className="text-xs text-slate-500">Phone</Label>
          <Input value={clientData.client_phone || ""} onChange={(e) => handleField("client_phone", e.target.value)} placeholder="+1 234 567 890" className="mt-1 border-slate-200" />
        </div>
        <div>
          <Label className="text-xs text-slate-500">TRN</Label>
          <Input value={clientData.client_trn || ""} onChange={(e) => handleField("client_trn", e.target.value)} placeholder="Tax Registration Number" className="mt-1 border-slate-200" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs text-slate-500">Address</Label>
          <Input value={clientData.client_address || ""} onChange={(e) => handleField("client_address", e.target.value)} placeholder="123 Main St, City, Country" className="mt-1 border-slate-200" />
        </div>
      </div>
    </div>
  );
}