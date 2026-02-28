import Head from "next/head";
import { useState } from "react";

export default function InvestorSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onChangePassword = (e) => {
    e.preventDefault();
  };

  const onRecover = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <Head>
        <title>Settings | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
          Settings
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Password & Recovery
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          Change password or request password recovery. (Frontend only)
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <h2 className="text-base font-semibold text-hive-charcoal">
              Change password
            </h2>

            <form onSubmit={onChangePassword} className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  Current password
                </label>
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  New password
                </label>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  Confirm new password
                </label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
              >
                Update Password
              </button>

              <p className="text-xs text-hive-slate">
                This is UI-only. Password updates will be enabled after backend is
                wired.
              </p>
            </form>
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
            <h2 className="text-base font-semibold text-hive-taupe">
              Recover password
            </h2>
            <p className="mt-3 text-sm leading-6 text-hive-light/80">
              Request a password reset link or OTP. (UI-only)
            </p>

            <form onSubmit={onRecover} className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-light">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-md border border-hive-taupe/40 bg-hive-slate px-3 py-2 text-sm text-hive-light outline-none focus:border-hive-taupe"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-hive-taupe px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
              >
                Send Recovery Link
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
