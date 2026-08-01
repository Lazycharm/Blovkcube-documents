import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Signup() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError("Company or business name is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!termsAccepted) {
      setError("You must accept the Terms of Service and Privacy Policy to continue");
      return;
    }

    setIsLoading(true);
    try {
      const data = await signup(email, password, companyName.trim());
      if (data?.session) {
        // Confirmation not required on this project - already logged in.
        navigate("/");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-3">
            <h1 className="text-lg font-semibold">Check your email</h1>
            <p className="text-sm text-slate-500">
              We've sent a confirmation link to <strong>{email}</strong>. Click it, then sign in to set up {companyName}.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">Back to sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company / business name</Label>
              <Input id="companyName" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your business name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex items-start gap-2 pt-1">
              <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} className="mt-0.5" />
              <label htmlFor="terms" className="text-sm text-slate-600 leading-snug cursor-pointer">
                I agree to the <Link to="/terms" className="text-slate-900 font-medium hover:underline" target="_blank">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-slate-900 font-medium hover:underline" target="_blank">Privacy Policy</Link>
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isLoading || !termsAccepted} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create account
            </Button>
          </form>
          <p className="text-sm text-center text-slate-500 mt-4">
            Already have an account? <Link to="/login" className="font-medium text-slate-900 hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
