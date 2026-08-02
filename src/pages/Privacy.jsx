import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon" className="rounded-xl" aria-label="Back to Dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm space-y-4 prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
          <p className="text-sm text-slate-400">Last updated: August 2026</p>

          <h2>1. What We Collect</h2>
          <p>When you create an account we collect your email address and the company name you register with. When you use the service, we store the client, document, and warranty data you enter, along with any logo images you upload.</p>

          <h2>2. How We Use It</h2>
          <p>Your data is used to provide the service: generating and storing your documents, keeping your client list, and managing your subscription. We do not sell your data.</p>

          <h2>3. Data Storage</h2>
          <p>Data is stored in our database provider with row-level access controls, so it is only accessible to authenticated members of your own company.</p>

          <h2>4. Payment Data</h2>
          <p>Subscription payments are processed by our third-party payment processor. We do not store your card or payment credentials directly.</p>

          <h2>5. Data Retention</h2>
          <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data by contacting us.</p>

          <h2>6. Third Parties</h2>
          <p>We use third-party infrastructure providers (database hosting, payment processing) to operate the service. These providers process data only as needed to provide their service to us.</p>

          <h2>7. Changes</h2>
          <p>We may update this policy from time to time. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
        </div>
      </div>
    </div>
  );
}
