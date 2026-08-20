import Head from "next/head";
import { useEffect, useState } from "react";

function formatStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "verified") return "Verified";
  if (value === "pending") return "Pending verification";
  return "Unknown";
}

function statusBadgeClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function InvestorProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("pending");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/auth/investor/profile");
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!cancelled) {
            setError(data?.message || "Unable to load profile.");
          }
          return;
        }

        const investor = data?.investor;
        if (!cancelled && investor) {
          setFullName(investor.fullName || "");
          setEmail(investor.email || "");
          setPhone(investor.phone || "");
          setCnic(investor.cnic || "");
          setAddress(investor.address || "");
          setStatus(investor.status || "pending");
        }
      } catch {
        if (!cancelled) setError("Unable to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (submitting || loading) return;

    const trimmedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail) {
      setError("Full name and email are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/investor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          email: normalizedEmail,
          phone: phone.trim(),
          cnic: cnic.trim(),
          address: address.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Unable to save profile.");
        return;
      }

      const investor = data?.investor;
      if (investor) {
        setFullName(investor.fullName || "");
        setEmail(investor.email || "");
        setPhone(investor.phone || "");
        setCnic(investor.cnic || "");
        setAddress(investor.address || "");
        setStatus(investor.status || status);
      }

      setSuccess(data?.message || "Profile updated successfully.");
    } catch {
      setError("Unable to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Profile | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Profile
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Registration Information
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              View and update the personal details you provided during registration.
            </p>
          </div>

          {!loading ? (
            <span
              className={
                "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold " +
                statusBadgeClass(status)
              }
            >
              {formatStatus(status)}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-xl border border-hive-taupe/20 bg-white/60 p-4 text-sm text-hive-slate">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={onSave} className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="investor-full-name" className="text-sm font-semibold text-hive-charcoal">
                  Full Name
                </label>
                <input
                  id="investor-full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="investor-email" className="text-sm font-semibold text-hive-charcoal">
                  Email
                </label>
                <input
                  id="investor-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="investor-phone" className="text-sm font-semibold text-hive-charcoal">
                  Phone
                </label>
                <input
                  id="investor-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  autoComplete="tel"
                  placeholder="+92 ..."
                />
              </div>

              <div>
                <label htmlFor="investor-cnic" className="text-sm font-semibold text-hive-charcoal">
                  CNIC
                </label>
                <input
                  id="investor-cnic"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder="35202-1234567-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="investor-address" className="text-sm font-semibold text-hive-charcoal">
                Address
              </label>
              <input
                id="investor-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                autoComplete="street-address"
                placeholder="Street, area, city"
              />
            </div>

            <div className="rounded-2xl bg-hive-charcoal p-5 text-hive-light">
              <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                Verification
              </p>
              <p className="mt-2 text-sm leading-6 text-hive-light/80">
                Account verification status is managed by Hive admin. You can update your contact
                details here; major identity changes may be reviewed for compliance.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={
                "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors " +
                (submitting
                  ? "cursor-not-allowed bg-hive-taupe/60 text-hive-charcoal"
                  : "bg-hive-taupe text-hive-charcoal hover:bg-hive-light")
              }
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
