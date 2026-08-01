import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4 prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
          <p className="text-sm text-slate-400">Last updated: August 2026</p>

          <h2>1. The Service</h2>
          <p>This application lets registered businesses ("you", "your company") create, manage, and store tax invoices, quotations, receipts, and warranty documents, and manage a client list for that purpose.</p>

          <h2>2. Accounts and Companies</h2>
          <p>Creating an account creates a company workspace. Data you enter — clients, documents, warranties, and company settings — is scoped to your company and is not visible to other companies using the service. You are responsible for keeping your login credentials secure and for the accuracy of the information you enter.</p>

          <h2>3. Subscriptions and Billing</h2>
          <p>Some features are offered on a paid subscription plan, billed via our payment processor. Subscriptions renew automatically until cancelled. You can view your current plan and status in Company Settings.</p>

          <h2>4. Your Data</h2>
          <p>You retain ownership of the client, document, and company data you enter into the service. You are responsible for the accuracy and legality of any invoices, quotations, or receipts you generate.</p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to use the service to generate fraudulent documents, to attempt to access another company's data, or to interfere with the operation of the service.</p>

          <h2>6. Termination</h2>
          <p>You may stop using the service at any time. We may suspend or terminate accounts that violate these terms.</p>

          <h2>7. Disclaimer</h2>
          <p>The service is provided "as is" without warranties of any kind. We are not liable for indirect or consequential damages arising from use of the service.</p>

          <h2>8. Changes</h2>
          <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
        </div>
      </div>
    </div>
  );
}
