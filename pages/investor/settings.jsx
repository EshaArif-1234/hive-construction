import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import PasswordInput from "../../components/PasswordInput";

export default function InvestorSettingsPage() {
  const [email, setEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch("/api/auth/investor/me");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setEmail(data?.investor?.email || "");
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const onChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (submitting) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/investor/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Unable to update password.");
        return;
      }

      setSuccess(data?.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to update password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Settings | Hive Construction</title>
      </Head>

      <div className="space-y-6">
        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
            Settings
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
            Password & Recovery
          </h1>
          <p className="mt-2 text-sm leading-6 text-hive-slate">
            Update your login credentials or reset your password if you cannot sign in.
          </p>

          <div className="mt-6 rounded-2xl border border-hive-taupe/20 bg-white/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-hive-slate/70">
              Signed in as
            </p>
            <p className="mt-1 text-sm font-semibold text-hive-charcoal">
              {loadingProfile ? "Loading…" : email || "Investor"}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <h2 className="text-base font-semibold text-hive-charcoal">Change password</h2>
          <p className="mt-2 text-sm text-hive-slate">
            Enter your current password, then choose a new one. You will stay signed in after updating.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {success}
            </div>
          ) : null}

          <form onSubmit={onChangePassword} className="mt-6 max-w-md grid gap-4">
            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <PasswordInput
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={submitting}
              className={
                "inline-flex w-full items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors sm:w-auto " +
                (submitting
                  ? "cursor-not-allowed bg-hive-taupe/60 text-hive-charcoal"
                  : "bg-hive-charcoal text-hive-light hover:text-hive-taupe")
              }
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-charcoal p-6 text-hive-light">
          <h2 className="text-base font-semibold text-hive-taupe">Forgot your password?</h2>
          <p className="mt-3 text-sm leading-6 text-hive-light/80">
            If you cannot remember your current password, use the email on your investor account to receive a
            4-digit code and set a new password.
          </p>
          <Link
            href="/forgot-password"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-hive-taupe px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
          >
            Reset password via email
          </Link>
        </div>
      </div>
    </>
  );
}
