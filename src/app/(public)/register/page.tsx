/* ════════════════════════════════════════════════════════
   Citizen Registration Page
   ════════════════════════════════════════════════════════ */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button, Input, Card } from "@/components/ui";
import { ShieldIcon, ArrowRightIcon, CheckCircleIcon } from "@/components/ui/icons";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    // TODO: POST /api/auth/register/citizen
    setTimeout(() => {
      setLoading(false);
      setError("Registration system is being configured. Please try again later.");
    }, 1000);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center pt-16 pb-16 px-4">
        <div className="w-full max-w-md fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
              <ShieldIcon size={28} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-sm text-text-tertiary">
              Join Sentinel City Intelligence to report and track civic issues
            </p>
          </div>

          {/* Registration Form */}
          <Card padding="lg" variant="elevated">
            <form onSubmit={handleRegister} className="space-y-5">
              <Input
                label="Full name"
                type="text"
                placeholder="Your name"
                value={formData.displayName}
                onChange={update("displayName")}
                required
                autoComplete="name"
              />
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={update("email")}
                required
                autoComplete="email"
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={update("phone")}
                hint="Optional — used for SMS notifications if enabled"
                autoComplete="tel"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={update("password")}
                required
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={update("confirmPassword")}
                required
                autoComplete="new-password"
              />

              {error && (
                <div className="bg-error-bg border border-error-border rounded-md p-3 text-sm text-error">
                  {error}
                </div>
              )}

              {/* Privacy */}
              <p className="text-xs text-text-tertiary leading-relaxed">
                By creating an account, you agree to our terms of service and
                privacy policy. Your data is used only for civic report processing.
              </p>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={<ArrowRightIcon size={16} />}
              >
                Create Account
              </Button>
            </form>
          </Card>

          {/* Login link */}
          <p className="text-center text-sm text-text-tertiary mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
