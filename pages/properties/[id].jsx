import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import InfoCard from "@/components/InfoCard";
import StatusBadge from "@/components/StatusBadge";
import WebsiteFooter from "@/components/WebsiteFooter";

function svgDataUri(label) {
  const safe = String(label ?? "Property").slice(0, 48);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#f4f4f5"/>
  <text x="60" y="120" fill="#D4AF37" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700">Hive Construction</text>
  <text x="60" y="190" fill="#27272a" font-family="Arial, Helvetica, sans-serif" font-size="34">${safe}</text>
  <text x="60" y="248" fill="#71717a" font-family="Arial, Helvetica, sans-serif" font-size="18">Image placeholder</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function formatStatus(status) {
  if (status === "available") return "Available";
  if (status === "in-progress") return "In Progress";
  if (status === "sold") return "Sold";
  return "Available";
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `PKR ${n.toLocaleString()} (Est.)`;
}

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { id, invest } = router.query;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [investError, setInvestError] = useState("");
  const [investSuccess, setInvestSuccess] = useState("");
  const [investSubmitting, setInvestSubmitting] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (typeof id !== "string" || !id) return;
    let cancelled = false;
    const run = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data?.message || "Unable to load property.");
          if (!cancelled) setProperty(null);
          return;
        }
        if (!cancelled) setProperty(data?.property || null);
        if (!cancelled) setActiveIndex(0);
      } catch (e) {
        if (!cancelled) {
          setError("Unable to load property.");
          setProperty(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setCheckingAuth(true);
      try {
        const res = await fetch("/api/auth/investor/me");
        if (!cancelled) setIsLoggedIn(res.ok);
      } catch (e) {
        if (!cancelled) setIsLoggedIn(false);
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (invest === "1" && isLoggedIn) {
      setShowInvestModal(true);
    }
  }, [invest, isLoggedIn]);

  const goToLoginToInvest = () => {
    if (typeof window === "undefined") return;
    const nextUrl = `${window.location.pathname}?invest=1`;
    router.push({ pathname: "/login", query: { role: "investor", next: nextUrl } });
  };

  const onInvest = async (e) => {
    e.preventDefault();
    setInvestError("");
    setInvestSuccess("");
    if (investSubmitting) return;

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setInvestError("Please enter a valid positive amount.");
      return;
    }

    if (!property?.id) {
      setInvestError("Property not loaded.");
      return;
    }

    setInvestSubmitting(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id, amount: amt }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          goToLoginToInvest();
          return;
        }
        setInvestError(data?.message || "Unable to invest.");
        return;
      }

      setInvestSuccess("Investment created successfully.");
      setAmount("");
    } catch (e) {
      setInvestError("Unable to invest.");
    } finally {
      setInvestSubmitting(false);
    }
  };

  const activeImage = useMemo(() => {
    const urls = Array.isArray(property?.imageUrls) ? property.imageUrls : [];
    if (urls.length > 0 && activeIndex < urls.length) {
      return urls[activeIndex];
    }
    const count = Number(property?.imagesCount || 0);
    if (property?.id && count > 0 && activeIndex < count) {
      return `/api/properties/${property.id}/image?index=${activeIndex}`;
    }
    const label = property?.title || "Property";
    return svgDataUri(label);
  }, [property, activeIndex]);

  const galleryIndexes = useMemo(() => {
    const urls = Array.isArray(property?.imageUrls) ? property.imageUrls : [];
    if (urls.length > 0) return urls.map((_, i) => i);
    const count = Number(property?.imagesCount || 0);
    if (!Number.isFinite(count) || count <= 0) return [];
    return Array.from({ length: count }, (_, i) => i);
  }, [property]);

  const thumbSrc = (idx) => {
    const urls = Array.isArray(property?.imageUrls) ? property.imageUrls : [];
    if (urls[idx]) return urls[idx];
    if (property?.id) return `/api/properties/${property.id}/image?index=${idx}`;
    return "";
  };

  return (
    <>
      <Head>
        <title>
          {property?.title ? `${property.title} | ` : ""}Property Details | Hive
          Construction Ventures
        </title>
        <meta
          name="description"
          content="View property investment details, current status, estimated market value, and investment highlights for Hive Construction Ventures projects."
        />
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Property Details
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-hive-charcoal sm:text-4xl">
                    {property?.title}
                  </h1>
                  <StatusBadge status={formatStatus(property?.status)} />
                </div>
                <p className="mt-3 text-sm text-hive-slate">
                  {property?.location} • Residential
                </p>
              </div>
              <Link
                href="/properties"
                className="inline-flex rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Back to Properties
              </Link>
            </div>

            <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
              {error ? (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div className="mb-6 rounded-xl border border-hive-taupe/20 bg-hive-light p-3 text-sm text-hive-slate">
                  Loading property...
                </div>
              ) : null}

              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="grid gap-4">
                    <div className="relative isolate overflow-hidden rounded-2xl bg-zinc-100">
                      <div className="relative h-64 w-full sm:h-80">
                        {String(activeImage).startsWith("/api/") ||
                        String(activeImage).startsWith("data:") ? (
                          <img
                            src={activeImage}
                            alt={`${property?.title ?? "Property"} image`}
                            className="absolute inset-0 z-0 h-full w-full object-cover"
                          />
                        ) : (
                          <Image
                            src={activeImage}
                            alt={`${property?.title ?? "Property"} image`}
                            fill
                            className="z-0 object-cover"
                            sizes="(max-width: 1024px) 100vw, 66vw"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {(galleryIndexes ?? []).map((idx) => {
                        const src = thumbSrc(idx);
                        const isActive = idx === activeIndex;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            className={
                              "relative overflow-hidden rounded-xl border transition-colors " +
                              (isActive
                                ? "border-hive-taupe"
                                : "border-hive-taupe/20 hover:border-hive-taupe/60")
                            }
                            aria-label={`View image ${idx + 1}`}
                          >
                            <div className="relative h-16 w-full overflow-hidden bg-zinc-100">
                              <img
                                src={src}
                                alt={`Property image ${idx + 1}`}
                                className="absolute inset-0 z-0 h-full w-full object-cover"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <InfoCard
                      label="Total property cost"
                      value={formatCurrency(property?.totalCost)}
                      subtext="Estimated market value for investor reference."
                    />
                    <InfoCard
                      label="Profit sharing"
                      value="75% Investors / 25% Hive"
                      subtext="Profit distributed after sale settlement."
                    />
                    <InfoCard
                      label="Status"
                      value={formatStatus(property?.status)}
                      subtext="Read-only public project status."
                    />
                  </div>

                  <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                      <h2 className="text-base font-semibold text-hive-charcoal">
                        Property Overview
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-hive-slate">
                        This property listing is provided for informational purposes.
                      </p>
                      <div className="mt-4 space-y-2 text-sm text-hive-slate">
                        <p>
                          <span className="font-semibold text-hive-charcoal">
                            Location:
                          </span>{" "}
                          {property?.location}
                        </p>
                        <p>
                          <span className="font-semibold text-hive-charcoal">
                            Type:
                          </span>{" "}
                          Residential
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                      <h2 className="text-base font-semibold text-hive-charcoal">
                        Investment Information
                      </h2>
                      <div className="mt-3 space-y-3 text-sm leading-6 text-hive-slate">
                        <p>
                          <span className="font-semibold text-hive-charcoal">
                            Investor contribution:
                          </span>{" "}
                          Contact Hive for contribution options.
                        </p>
                        <p>
                          <span className="font-semibold text-hive-charcoal">
                            Hive’s contribution:
                          </span>{" "}
                          Based on project financing plan.
                        </p>
                        <div className="rounded-xl bg-hive-charcoal p-4 text-hive-light">
                          <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                            Profit-sharing ratio
                          </p>
                          <p className="mt-2 text-sm text-hive-light/80">
                            75% Investors • 25% Hive
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                      <h2 className="text-base font-semibold text-hive-charcoal">
                        Construction & Sale Status
                      </h2>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <InfoCard
                          label="Construction stage"
                          value={property?.constructionStage}
                        />
                        <InfoCard
                          label="Estimated completion"
                          value={property?.estimatedCompletion}
                        />
                        <InfoCard label="Sale status" value={property?.saleStatus} />
                        <InfoCard
                          label="Tracking"
                          value="Read-only"
                          subtext="Real-time tracking is shown when enabled for investors."
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                      <h2 className="text-base font-semibold text-hive-charcoal">
                        Exit Plan Summary
                      </h2>
                      <ul className="mt-4 space-y-2 text-sm leading-6 text-hive-slate">
                        <li>
                          <span className="font-semibold text-hive-charcoal">
                            Sale before one year:
                          </span>{" "}
                          Settlement handled per documented sale timeline.
                        </li>
                        <li>
                          <span className="font-semibold text-hive-charcoal">
                            Sale after one year:
                          </span>{" "}
                          Settlement handled per documented sale timeline.
                        </li>
                        <li>
                          <span className="font-semibold text-hive-charcoal">
                            Early withdrawal:
                          </span>{" "}
                          Subject to conditions, project status, and written terms.
                        </li>
                        <li>
                          <span className="font-semibold text-hive-charcoal">
                            Loss protection:
                          </span>{" "}
                          Original investment is protected under agreed security terms.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl bg-hive-charcoal p-6 text-hive-light">
                  <p className="text-sm font-semibold text-hive-taupe">
                    Next steps
                  </p>
                  <p className="mt-3 text-sm leading-6 text-hive-light/80">
                    This is a read-only property page. To proceed, choose an
                    investor action below.
                  </p>

                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      disabled={checkingAuth}
                      onClick={() => {
                        if (isLoggedIn) {
                          setInvestError("");
                          setInvestSuccess("");
                          setShowInvestModal(true);
                        } else {
                          goToLoginToInvest();
                        }
                      }}
                      className="inline-flex w-full items-center justify-center rounded-md bg-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
                    >
                      Invest
                    </button>

                    <Link
                      href="/properties"
                      className="inline-flex w-full items-center justify-center rounded-md border border-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                    >
                      Back to Properties
                    </Link>
                  </div>

                  <div className="mt-8 rounded-xl bg-hive-slate p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                      Investor note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-hive-light/80">
                      Investment details shown here are informational. Final terms
                      are defined by written documentation and project agreements.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showInvestModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Investments Collection
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-hive-charcoal">
                  Invest in {property?.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (investSubmitting) return;
                  setShowInvestModal(false);
                }}
                className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Close
              </button>
            </div>

            <form onSubmit={onInvest} className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <div className="rounded-xl border border-hive-taupe/20 bg-hive-light p-3 text-sm text-hive-slate">
                  <div>
                    Property ID: <span className="font-semibold text-hive-charcoal">{property?.id}</span>
                  </div>
                  <div className="mt-1">
                    Status: <span className="font-semibold text-hive-charcoal">{formatStatus(property?.status)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder="100000"
                  inputMode="numeric"
                />
              </div>

              {investSuccess ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {investSuccess}
                </div>
              ) : null}

              {investError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {investError}
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (investSubmitting) return;
                    setShowInvestModal(false);
                  }}
                  className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={investSubmitting}
                  className={
                    "rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe " +
                    (investSubmitting ? "opacity-70" : "")
                  }
                >
                  {investSubmitting ? "Submitting..." : "Invest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <WebsiteFooter />
    </>
  );
}
