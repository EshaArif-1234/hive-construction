import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

function RoleCard({ title, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full rounded-2xl border p-5 text-left transition-colors " +
        (selected
          ? "border-hive-taupe bg-hive-taupe/10"
          : "border-hive-taupe/20 bg-hive-light hover:border-hive-taupe/60")
      }
    >
      <p className="text-sm font-semibold text-hive-charcoal">{title}</p>
      <p className="mt-2 text-sm leading-6 text-hive-slate">{description}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-hive-taupe">
        Select
      </p>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const role = router.query.role;

  const selectedRole = useMemo(() => {
    if (role === "admin" || role === "investor") return role;
    return "";
  }, [role]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [selectedRole]);

  const setRole = (r) => {
    router.push({ pathname: "/login", query: { role: r } });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!selectedRole) {
      setError("Please select a role (Admin or Investor).");
      return;
    }

    const u = username.trim();
    const p = password;

    if (!u || !p) {
      setError("Please enter username and password.");
      return;
    }

    if (typeof window === "undefined") return;

    if (selectedRole === "admin") {
      window.localStorage.setItem("hive_admin_token", "ok");
      router.push("/admin");
      return;
    }

    if (selectedRole === "investor") {
      window.localStorage.setItem("hive_investor_token", "ok");
      router.push("/investor");
      return;
    }
  };

  return (
    <>
      <Head>
        <title>Login | Hive Construction</title>
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Access
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal sm:text-3xl">
                  Login
                </h1>
                <p className="mt-2 text-sm leading-6 text-hive-slate">
                  Choose your role, then sign in.
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/"
                  className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                >
                  Back to website
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                >
                  Sign Up
                </Link>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="grid gap-4">
                <h2 className="text-sm font-semibold text-hive-charcoal">
                  Select Role
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <RoleCard
                    title="Admin"
                    description="Hive staff access for managing properties, investments, security cheques, and reports."
                    selected={selectedRole === "admin"}
                    onClick={() => setRole("admin")}
                  />
                  <RoleCard
                    title="Investor"
                    description="Investor access to track contributions, project status, and profit-sharing reports."
                    selected={selectedRole === "investor"}
                    onClick={() => setRole("investor")}
                  />
                </div>

                <div className="rounded-2xl bg-hive-charcoal p-5 text-hive-light">
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Note
                  </p>
                  <p className="mt-2 text-sm leading-6 text-hive-light/80">
                    Investor dashboard will be enabled next. This flow is prepared
                    for role-based authentication.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-hive-charcoal">
                  Credentials
                </h2>

                <form onSubmit={onSubmit} className="mt-4 grid gap-4">
                  <div>
                    <label className="text-sm font-semibold text-hive-charcoal">
                      Username
                    </label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                      placeholder={selectedRole === "admin" ? "admin" : "your email / username"}
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-hive-charcoal">
                      Password
                    </label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                      placeholder={selectedRole === "admin" ? "admin" : "••••••••"}
                      autoComplete="current-password"
                    />
                  </div>

                  {selectedRole ? (
                    <div className="rounded-xl border border-hive-taupe/20 bg-hive-light p-3 text-sm text-hive-slate">
                      Role selected: <span className="font-semibold text-hive-charcoal">{selectedRole}</span>
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="mt-1 inline-flex items-center justify-center rounded-md bg-hive-taupe px-5 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
                  >
                    Continue
                  </button>

                  {selectedRole === "admin" ? (
                    <p className="text-xs text-hive-slate">
                      Admin credentials are not enforced yet (frontend-only).
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
