"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useSignIn } from "@clerk/nextjs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");

  const { isLoaded, signIn, setActive } = useSignIn();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signIn) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting sign in with email:", email);
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      console.log("Sign in result:", result);
      console.log("Result status:", result.status);

      if (result.status === "complete") {
        console.log("Setting active session:", result.createdSessionId);
        await setActive({ session: result.createdSessionId });
        console.log("Session set, redirecting to /");

        // Try window.location instead of router
        window.location.href = "/";
      } else {
        console.log("Sign in not complete, status:", result.status);
        setError(`Sign in status: ${result.status}. Please try again.`);
      }
    } catch (err: any) {
      console.error("Error signing in:", err);
      console.error("Error details:", err.errors);

      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setError("");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <Image
            src="/android-chrome-192x192.png"
            alt="Foresight Logo"
            width={64}
            height={64}
            className="mx-auto rounded-lg"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your Foresight RCM dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === "email" ? "Welcome back" : "Enter your password"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your email address to continue"
                : `Enter the password for ${email}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <strong>{error}</strong>
              </Alert>
            )}

            <div className="relative min-h-[280px] transition-all duration-300 ease-in-out">
              {step === "email" ? (
                <div className="animate-fadeIn">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jane.doe@have-foresight.com"
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Continue
                    </Button>

                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Don&apos;t have an account?{" "}
                        <Link
                          href="/signup"
                          className="font-medium text-primary hover:text-primary/80"
                        >
                          Contact your administrator
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Show email with edit option */}
                    <div className="space-y-2">
                      <Label>Email address</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
                          {email}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleBackToEmail}
                          className="text-primary hover:text-primary/80"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBackToEmail}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back
                      </Button>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 Foresight Industries. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
