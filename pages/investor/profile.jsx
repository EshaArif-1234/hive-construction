import Head from "next/head";
import { useState } from "react";

export default function InvestorProfilePage() {
  const [fullName, setFullName] = useState("Ali Raza");
  const [email, setEmail] = useState("ali@example.com");
  const [phone, setPhone] = useState("+92 300 0000000");
  const [cnic, setCnic] = useState("00000-0000000-0");
  const [address, setAddress] = useState("Lahore, Pakistan");

  const onSave = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <Head>
        <title>Profile | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
          Profile
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
          Registration Information
        </h1>
        <p className="mt-2 text-sm leading-6 text-hive-slate">
          View and edit your personal details. (Frontend only)
        </p>

        <form onSubmit={onSave} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-hive-charcoal">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-hive-charcoal">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-hive-charcoal">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-hive-charcoal">
                CNIC
              </label>
              <input
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-hive-charcoal">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
            />
          </div>

          <div className="rounded-2xl bg-hive-charcoal p-5 text-hive-light">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Verification
            </p>
            <p className="mt-2 text-sm leading-6 text-hive-light/80">
              Profile changes may require verification by Hive admin depending on
              your compliance requirements.
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-hive-taupe px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
          >
            Save Changes
          </button>

          <p className="text-xs text-hive-slate">
            This page is UI-only. Profile updates will be saved once backend APIs
            are connected.
          </p>
        </form>
      </div>
    </>
  );
}
