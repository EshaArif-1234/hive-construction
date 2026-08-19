import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import PasswordInput from "../components/PasswordInput";

const steps = {
  email: "email",
  otp: "otp",
  password: "password",
  success: "success",
};

function storageKey(suffix, role) {
  return `hive_fp_${suffix}_${role}`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const role = useMemo(() => {
    const r = router.query.role;
    return r === "admin" ? "admin" : "investor";
  }, [router.query.role]);

  const isAdmin = role === "admin";
  const loginHref = isAdmin ? "/login?role=admin" : "/login?role=investor";
  const accountLabel = isAdmin ? "Admin account" : "Investor account";

  const [step, setStep] = useState(steps.email);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof window === "undefined") return;

    const storedEmail = sessionStorage.getItem(storageKey("email", role));
    const storedToken = sessionStorage.getItem(storageKey("reset", role));

    setStep(steps.email);
    setEmail(storedEmail || "");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");

    if (storedToken) {
      setResetToken(storedToken);
      setStep(steps.password);
    } else {
      setResetToken("");
    }
  }, [router.isReady, role]);

  const persistEmail = useCallback(
    (value) => {
      setEmail(value);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(storageKey("email", role), value);
      }
    },
    [role]
  );

  const clearFpStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(storageKey("email", role));
      sessionStorage.removeItem(storageKey("reset", role));
    }
  }, [role]);

  const onSendEmail = async (e) => {
    e.preventDefault();
    setError("");
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to send email.");
        return;
      }
      persistEmail(normalized);
      setOtp("");
      setStep(steps.otp);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    const digits = String(otp).replace(/\D/g, "").slice(0, 4);
    if (digits.length !== 4) {
      setError("Enter the 4-digit code from your email.");
      return;
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Email missing. Go back and enter your email again.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-forgot-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, otp: digits.padStart(4, "0"), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Invalid code.");
        return;
      }
      const token = data?.resetToken;
      if (!token || typeof token !== "string") {
        setError("Unable to continue. Try again.");
        return;
      }
      setResetToken(token);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(storageKey("reset", role), token);
      }
      setNewPassword("");
      setConfirmPassword("");
      setStep(steps.password);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const token =
      resetToken ||
      (typeof window !== "undefined" ? sessionStorage.getItem(storageKey("reset", role)) : "");
    if (!token) {
      setError("Session expired. Start over from the login page.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to update password.");
        return;
      }
      clearFpStorage();
      setResetToken("");
      setStep(steps.success);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError("");
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Email missing. Go back one step.");
      return;
    }
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to resend.");
        return;
      }
      setOtp("");
    } catch {
      setError("Unable to resend.");
    } finally {
      setResendLoading(false);
    }
  };

  const goBackToEmail = () => {
    setError("");
    setOtp("");
    setStep(steps.email);
  };

  return (
    <>
      <Head>
        <title>Forgot Password | Hive Construction</title>
      </Head>

      <section className="pb-8 sm:pb-10 md:pb-16">
        <div className="mx-auto max-w-lg">
          <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  {accountLabel}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal sm:text-3xl">
                  {step === steps.email && "Reset password"}
                  {step === steps.otp && "Enter code"}
                  {step === steps.password && "New password"}
                  {step === steps.success && "Password updated"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-hive-slate">
                  {step === steps.email &&
                    (isAdmin
                      ? "Enter any real email inbox you can access. We will send a 4-digit code there to reset the Hive admin password."
                      : "Enter the email you used to register. We will send a 4-digit code.")}
                  {step === steps.otp &&
                    "We emailed a 4-digit code. It expires in 15 minutes."}
                  {step === steps.password &&
                    `Choose a new password for your ${isAdmin ? "admin" : "investor"} account.`}
                  {step === steps.success &&
                    "Your password was changed. You can sign in with the new password."}
                </p>
              </div>
              <Link
                href={loginHref}
                className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Back to login
              </Link>
            </div>

            {step === steps.email ? (
              <form onSubmit={onSendEmail} className="mt-8 grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder={isAdmin ? "admin@example.com" : "you@example.com"}
                  />
                </div>
                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={loading}
                  className={
                    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors " +
                    (loading
                      ? "bg-hive-taupe/60 text-hive-charcoal"
                      : "bg-hive-taupe text-hive-charcoal hover:bg-hive-light")
                  }
                >
                  {loading ? "Sending…" : "Send code"}
                </button>
              </form>
            ) : null}

            {step === steps.otp ? (
              <form onSubmit={onVerifyOtp} className="mt-8 grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">4-digit code</label>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="••••"
                  />
                  <p className="mt-2 text-xs text-hive-slate">
                    Code expires 15 minutes after it was sent.
                  </p>
                </div>
                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    disabled={resendLoading}
                    onClick={onResend}
                    className="text-sm font-semibold text-hive-charcoal underline decoration-hive-taupe hover:text-hive-taupe"
                  >
                    {resendLoading ? "Resending…" : "Resend code"}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={
                    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors " +
                    (loading
                      ? "bg-hive-taupe/60 text-hive-charcoal"
                      : "bg-hive-taupe text-hive-charcoal hover:bg-hive-light")
                  }
                >
                  {loading ? "Checking…" : "Continue"}
                </button>
              </form>
            ) : null}

            {step === steps.password ? (
              <form onSubmit={onResetPassword} className="mt-8 grid gap-4">
                <PasswordInput
                  label="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <PasswordInput
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={loading}
                  className={
                    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors " +
                    (loading
                      ? "bg-hive-taupe/60 text-hive-charcoal"
                      : "bg-hive-taupe text-hive-charcoal hover:bg-hive-light")
                  }
                >
                  {loading ? "Saving…" : "Update password"}
                </button>
              </form>
            ) : null}

            {step === steps.success ? (
              <div className="mt-8 grid gap-6">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
                  You can now sign in with your new password.
                </div>
                <Link
                  href={loginHref}
                  className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                >
                  Back to login
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
