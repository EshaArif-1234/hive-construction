import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    setError("");
    setSuccess("");

    const fullName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const phoneValue = phone.trim();

    if (!fullName || !normalizedEmail || !password) {
      setError("Please fill in full name, email, and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/investor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: normalizedEmail,
          phone: phoneValue,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Unable to sign up.");
        return;
      }

      setSuccess(
        data?.message ||
          "Registration submitted. Your account will be verified before access is granted."
      );
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Unable to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | Hive Construction</title>
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Investor Registration
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal sm:text-3xl">
                  Sign Up
                </h1>
                <p className="mt-2 text-sm leading-6 text-hive-slate">
                  Register as an investor. Your account will be verified before
                  credentials are issued.
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                >
                  Login
                </Link>
                <Link
                  href="/"
                  className="rounded-md bg-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                >
                  Back to website
                </Link>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-8 grid gap-4">
              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder="you@example.com"
                  type="email"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder="+92 ..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">
                    Password
                  </label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">
                    Confirm Password
                  </label>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {success ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="rounded-2xl bg-hive-charcoal p-5 text-hive-light">
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Verification
                </p>
                <p className="mt-2 text-sm leading-6 text-hive-light/80">
                  After you submit registration details, Hive admin will verify your
                  profile and provide login credentials.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={
                  "mt-1 inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors " +
                  (loading
                    ? "bg-hive-taupe/60 text-hive-charcoal"
                    : "bg-hive-taupe text-hive-charcoal hover:bg-hive-light")
                }
              >
                {loading ? "Submitting..." : "Submit Registration"}
              </button>

              <p className="text-xs text-hive-slate">
                This is a frontend-only placeholder. Backend registration workflow
                will be wired next.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
