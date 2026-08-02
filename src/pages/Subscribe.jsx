import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { createZiinaPayment } from "@/services/ziina";
import { getMySubscription } from "@/services/companies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

const PRO_FEATURES = [
  "Unlimited invoices, quotations & receipts",
  "Unlimited clients",
  "Custom company branding & logo on documents",
  "Warranty certificates",
  "Priority support",
];

export default function Subscribe() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!company?.id) return;
    getMySubscription(company.id).then(setSubscription).catch((err) => console.error("Failed to load subscription:", err));
  }, [company?.id]);

  const handleUpgrade = async () => {
    setError(null);
    setLoading(true);
    try {
      const { redirectUrl } = await createZiinaPayment();
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err.message || "Failed to start payment");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("CompanySettings")}>
            <Button variant="outline" size="icon" className="rounded-xl" aria-label="Back to Company Settings">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Upgrade to Pro</h1>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-baseline gap-1">
              <span>AED 49</span>
              <span className="text-sm font-normal text-slate-400">/ month</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button onClick={handleUpgrade} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Pay with Ziina
            </Button>

            {subscription && (
              <p className="text-xs text-center text-slate-400">
                Current plan: <span className="capitalize">{subscription.plan || "free"}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
