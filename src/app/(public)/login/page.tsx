/* ════════════════════════════════════════════════════════
   Login Page
   ════════════════════════════════════════════════════════ */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button, Input, Card } from "@/components/ui";
import { ShieldIcon, ArrowRightIcon } from "@/components/ui/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // TODO: Replace with actual API call to POST /api/auth/login
    setTimeout(() => {
      setLoading(false);
      setError("Authentication system is being configured. Please try again later.");
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
              Welcome back
            </h1>
            <p className="text-sm text-text-tertiary">
              Sign in to access your Sentinel City Intelligence account
            </p>
          </div>

          {/* Login Form */}
          <Card padding="lg" variant="elevated">
            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="bg-error-bg border border-error-border rounded-md p-3 text-sm text-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={<ArrowRightIcon size={16} />}
              >
                Sign in
              </Button>
            </form>
          </Card>

          {/* Register link */}
          <p className="text-center text-sm text-text-tertiary mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Create one
            </Link>
          </p>

          {/* Portal shortcuts */}
          <div className="mt-8 pt-6 border-t border-divider">
            <p className="text-xs text-text-tertiary text-center mb-3">
              Other portals
            </p>
            <div className="flex justify-center gap-4">
              {[
                { label: "Admin", href: "/admin" },
                { label: "Department", href: "/department" },
                { label: "Worker", href: "/worker" },
              ].map((portal) => (
                <Link
                  key={portal.href}
                  href={portal.href}
                  className="text-xs text-text-tertiary hover:text-accent transition-colors"
                >
                  {portal.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
