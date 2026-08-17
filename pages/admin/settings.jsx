import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import PasswordInput from "../../components/PasswordInput";

export default function AdminSettingsPage() {
  const [email, setEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");

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
        const res = await fetch("/api/auth/admin/profile");
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setEmail(data?.admin?.email || "");
          setRecoveryEmail(data?.admin?.recoveryEmail || "");
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

  const onSaveRecoveryEmail = async (e) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");

    const normalized = recoveryEmail.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      setRecoveryError("Enter a valid recovery email.");
      return;
    }

    setRecoverySubmitting(true);
    try {
      const res = await fetch("/api/auth/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryEmail: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRecoveryError(data?.message || "Unable to save recovery email.");
        return;
      }
      setRecoveryEmail(data?.admin?.recoveryEmail || normalized);
      setRecoverySuccess(data?.message || "Recovery email saved.");
    } catch {
      setRecoveryError("Unable to save recovery email.");
    } finally {
      setRecoverySubmitting(false);
    }
  };

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
      const res = await fetch("/api/auth/admin/change-password", {
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
        <title>Settings | Hive Construction Admin</title>
      </Head>

      <div className="space-y-6">
        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Settings</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">Account settings</h1>
          <p className="mt-2 text-sm leading-6 text-hive-slate">
            Manage your admin account security. Use a strong password and keep it private.
          </p>

          <div className="mt-6 rounded-2xl border border-hive-taupe/20 bg-white/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-hive-slate/70">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-hive-charcoal">
              {loadingProfile ? "Loading…" : email || "Administrator"}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <h2 className="text-base font-semibold text-hive-charcoal">Recovery email (optional)</h2>
          <p className="mt-2 text-sm text-hive-slate">
            Admin login uses <span className="font-semibold text-hive-charcoal">{email || "hiveconstruction@admin.com"}</span>{" "}
            (not a real mailbox). For password reset, go to Forgot password and enter <strong>any real email</strong> you
            can open — the code is sent there.
          </p>

          <form onSubmit={onSaveRecoveryEmail} className="mt-6 max-w-md grid gap-4">
            <div>
              <label htmlFor="admin-recovery-email" className="text-sm font-semibold text-hive-charcoal">
                Recovery email
              </label>
              <input
                id="admin-recovery-email"
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="you@vu.edu.pk"
                className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
              />
            </div>

            {recoveryError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{recoveryError}</div>
            ) : null}
            {recoverySuccess ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{recoverySuccess}</div>
            ) : null}

            <button
              type="submit"
              disabled={recoverySubmitting}
              className={
                "inline-flex w-full items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors sm:w-auto " +
                (recoverySubmitting
                  ? "cursor-not-allowed bg-hive-taupe/60 text-hive-charcoal"
                  : "border border-hive-charcoal bg-white text-hive-charcoal hover:border-hive-taupe hover:text-hive-taupe")
              }
            >
              {recoverySubmitting ? "Saving…" : "Save recovery email"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
          <h2 className="text-base font-semibold text-hive-charcoal">Change password</h2>
          <p className="mt-2 text-sm text-hive-slate">
            Enter your current password, then choose a new password.
          </p>

          <form onSubmit={onChangePassword} className="mt-6 max-w-md grid gap-4">
            <PasswordInput
              id="admin-current-password"
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <PasswordInput
              id="admin-new-password"
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordInput
              id="admin-confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            ) : null}

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
            Enter any real email on the reset page. The code is sent to that inbox and lets you set a new admin password.
          </p>
          <Link
            href="/forgot-password?role=admin"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-hive-taupe px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
          >
            Reset password via email
          </Link>
        </div>
      </div>
    </>
  );
}
