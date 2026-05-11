import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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
  const value = String(status || "").toLowerCase();
  if (value === "draft") return "Draft";
  if (value === "active") return "Active";
  if (value === "paused") return "Paused";
  if (value === "completed") return "Completed";
  if (value === "archived") return "Archived";
  return "Draft";
}

function formatPlainCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "PKR -";
  return `PKR ${n.toLocaleString()}`;
}

function formatExpectedProfit(minPct, maxPct) {
  const min = Number(minPct);
  const max = Number(maxPct);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return "N/A";
  if (max < min || max <= 0) return "N/A";
  return `${min}-${max}%`;
}

function formatYesNo(value) {
  return value ? "Yes" : "No";
}

function formatEarlyWithdrawalProfitRule(rule) {
  const normalized = String(rule || "").toLowerCase();
  if (normalized === "no-profit") return "No Profit";
  if (normalized === "partial-profit") return "Partial Profit";
  if (normalized === "full-profit") return "Full Profit";
  return "No Profit";
}

function formatRiskLevel(level) {
  const normalized = String(level || "").toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "high") return "High";
  return "Medium";
}

function humanizeKebab(value) {
  const v = String(value || "").trim();
  if (!v) return "N/A";
  return v
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
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
  const [paymentMethod, setPaymentMethod] = useState("bank-transfer");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
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
        if (!cancelled) {
          const p = data?.property || null;
          if (!p) {
            setProperty(null);
          } else {
            const required = Number(p.investorFundingRequired || 0);
            const collected = Number(p.fundingCollected || 0);
            const fundingProgressPct =
              required > 0 ? Math.min(100, Math.max(0, (collected / required) * 100)) : 0;
            setProperty({
              ...p,
              location: p.city || "",
              fullAddress: p.address || "",
              expectedSalePrice: p.expectedSellingPrice,
              investorContribution: p.investorFundingRequired,
              expectedProfitMinPct: p.expectedProfitPercentage,
              expectedProfitMaxPct: p.expectedProfitPercentage,
              expectedSaleDurationMonths: p.expectedSellingDuration,
              currentFundingCollected: p.fundingCollected,
              minimumInvestmentAllowed: p.minimumInvestment,
              investorProfitSharePct: p.investorProfitShare,
              hiveProfitSharePct: p.hiveProfitShare,
              expectedCompletionDurationMonths: p.expectedCompletionDuration,
              expectedSellingDurationMonths: p.expectedSellingDuration,
              earlyWithdrawalProfitRule: p.earlyWithdrawalProfit,
              featuredProperty: p.featured,
              fundingProgressPct,
              status: p.listingStatus,
            });
          }
        }
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

  const canInvest =
    property?.listingStatus === "active" &&
    ["under-construction", "gray-structure-completed", "finishing-work"].includes(
      String(property?.constructionStatus || "")
    );

  useEffect(() => {
    if (invest === "1" && isLoggedIn && canInvest) {
      setShowInvestModal(true);
    }
  }, [invest, isLoggedIn, canInvest]);

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

    if (!paymentMethod) {
      setInvestError("Please select a payment method.");
      return;
    }

    if (!paymentScreenshot) {
      setInvestError("Please upload a payment screenshot.");
      return;
    }

    setInvestSubmitting(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          amount: amt,
          paymentMethod,
          paymentScreenshotName: paymentScreenshot.name || "",
        }),
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
      setPaymentMethod("bank-transfer");
      setPaymentScreenshot(null);
      setTimeout(() => {
        router.push("/investor/investments");
      }, 700);
    } catch (e) {
      setInvestError("Unable to invest.");
    } finally {
      setInvestSubmitting(false);
    }
  };

  const activeImage = useMemo(() => {
    const urls = [
      property?.thumbnail?.url,
      ...(Array.isArray(property?.galleryImages)
        ? property.galleryImages.map((x) => x?.url).filter(Boolean)
        : []),
    ].filter(Boolean);
    if (urls.length > 0 && activeIndex < urls.length) {
      return urls[activeIndex];
    }
    const label = property?.title || "Property";
    return svgDataUri(label);
  }, [property, activeIndex]);

  const galleryIndexes = useMemo(() => {
    const urls = [
      property?.thumbnail?.url,
      ...(Array.isArray(property?.galleryImages)
        ? property.galleryImages.map((x) => x?.url).filter(Boolean)
        : []),
    ].filter(Boolean);
    if (urls.length <= 0) return [];
    return urls.map((_, i) => i);
  }, [property]);

  const thumbSrc = (idx) => {
    const urls = [
      property?.thumbnail?.url,
      ...(Array.isArray(property?.galleryImages)
        ? property.galleryImages.map((x) => x?.url).filter(Boolean)
        : []),
    ].filter(Boolean);
    return urls[idx] || "";
  };

  const totalCostNum = Number(property?.totalCost || 0);
  const investorContributionNum = Number(property?.investorContribution || 0);
  const currentFundingCollectedNum = Number(property?.currentFundingCollected || 0);
  const annualRoiPctNum = Number(property?.expectedAnnualRoiPct || property?.expectedProfitPercentage || 0);
  const hiveContributionNum = Number(property?.hiveContribution || 0);
  const minimumInvestmentNum = Number(property?.minimumInvestmentAllowed || property?.minimumInvestment || 0);
  const fundingProgressNum = Math.min(100, Math.max(0, Number(property?.fundingProgressPct || 0)));
  const availableFundingNeeded = Math.max(
    0,
    investorContributionNum - (investorContributionNum * fundingProgressNum) / 100
  );
  const estimatedSharePct =
    Number.isFinite(Number(amount)) && Number(amount) > 0 && investorContributionNum > 0
      ? (Number(amount) / investorContributionNum) * 100
      : 0;
  const avgExpectedProfitPct =
    (Number(property?.expectedProfitMinPct || 0) + Number(property?.expectedProfitMaxPct || 0)) / 2;
  const estimatedProfitAmount =
    Number.isFinite(Number(amount)) && Number(amount) > 0 && Number.isFinite(avgExpectedProfitPct)
      ? (Number(amount) * avgExpectedProfitPct) / 100
      : 0;
  const estimatedReturnAmount =
    Number.isFinite(Number(amount)) && Number(amount) > 0
      ? Number(amount) + estimatedProfitAmount
      : 0;
  const investorsJoined = minimumInvestmentNum > 0
    ? Math.max(0, Math.floor(currentFundingCollectedNum / minimumInvestmentNum))
    : 0;
  const timelineStages = [
    "land-purchased",
    "gray-structure-completed",
    "finishing-work",
    "ready-for-sale",
    "sold",
  ];
  const currentStageIndex = timelineStages.indexOf(String(property?.constructionStatus || ""));

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
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_360px]">
            <div className="space-y-6">
              <div className="relative isolate overflow-hidden rounded-2xl border border-hive-taupe/20 bg-zinc-100">
                <div className="relative h-72 w-full sm:h-96">
                  {String(activeImage).startsWith("/api/") || String(activeImage).startsWith("data:") ? (
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
                      sizes="(max-width: 1024px) 100vw, 70vw"
                    />
                  )}
                </div>
                {property?.featuredProperty ? (
                  <div className="absolute right-4 top-4 rounded-full bg-hive-taupe px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-hive-charcoal">
                    Featured Property
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h1 className="text-2xl font-semibold tracking-tight text-hive-charcoal sm:text-4xl">{property?.title}</h1>
                <p className="mt-2 text-sm text-hive-slate">{property?.location}</p>
                <p className="mt-2 text-sm text-hive-slate">
                  {humanizeKebab(property?.type)} • {formatRiskLevel(property?.riskLevel)} Risk • {humanizeKebab(property?.constructionStatus)}
                </p>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Property Overview</h2>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[220px_1fr]">
                  <p className="font-semibold text-hive-charcoal">Type</p><p className="text-hive-slate">{humanizeKebab(property?.type)}</p>
                  <p className="font-semibold text-hive-charcoal">City</p><p className="text-hive-slate">{property?.location || "N/A"}</p>
                  <p className="font-semibold text-hive-charcoal">Address</p><p className="text-hive-slate">{property?.fullAddress || "N/A"}</p>
                  <p className="font-semibold text-hive-charcoal">Construction Status</p><p className="text-hive-slate">{humanizeKebab(property?.constructionStatus)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Financial Information</h2>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[220px_1fr]">
                  <p className="font-semibold text-hive-charcoal">Total Cost</p><p className="text-hive-slate">{formatPlainCurrency(totalCostNum)}</p>
                  <p className="font-semibold text-hive-charcoal">Investor Funding</p><p className="text-hive-slate">{formatPlainCurrency(investorContributionNum)}</p>
                  <p className="font-semibold text-hive-charcoal">Hive Contribution</p><p className="text-hive-slate">{formatPlainCurrency(hiveContributionNum)}</p>
                  <p className="font-semibold text-hive-charcoal">Expected ROI</p><p className="text-hive-slate">{formatExpectedProfit(property?.expectedProfitMinPct, property?.expectedProfitMaxPct)}</p>
                  <p className="font-semibold text-hive-charcoal">Minimum Investment</p><p className="text-hive-slate">{formatPlainCurrency(minimumInvestmentNum)}</p>
                  <p className="font-semibold text-hive-charcoal">Expected Duration</p><p className="text-hive-slate">{property?.expectedCompletionDurationMonths || 0} months</p>
                </div>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Funding Progress</h2>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-full rounded-full bg-hive-taupe" style={{ width: `${fundingProgressNum}%` }} />
                </div>
                <p className="mt-3 text-sm text-hive-slate">
                  {formatPlainCurrency(currentFundingCollectedNum)} raised out of {formatPlainCurrency(investorContributionNum)}
                </p>
                <p className="mt-1 text-sm text-hive-slate">Investors Joined: {investorsJoined}</p>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Investment Calculator</h2>
                <label className="mt-3 block text-sm font-semibold text-hive-charcoal">Enter Investment Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder="100000"
                  inputMode="numeric"
                />
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-[220px_1fr]">
                  <p className="font-semibold text-hive-charcoal">Estimated Ownership Share</p><p className="text-hive-slate">{estimatedSharePct.toFixed(2)}%</p>
                  <p className="font-semibold text-hive-charcoal">Estimated Profit</p><p className="text-hive-slate">{formatPlainCurrency(estimatedProfitAmount)}</p>
                  <p className="font-semibold text-hive-charcoal">Estimated Return</p><p className="text-hive-slate">{formatPlainCurrency(estimatedReturnAmount)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Property Description</h2>
                <p className="mt-3 text-sm leading-7 text-hive-slate">{property?.description || "No description provided yet."}</p>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Property Features</h2>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[220px_1fr]">
                  <p className="font-semibold text-hive-charcoal">Bedrooms</p><p className="text-hive-slate">{Number(property?.bedrooms || 0)}</p>
                  <p className="font-semibold text-hive-charcoal">Bathrooms</p><p className="text-hive-slate">{Number(property?.bathrooms || 0)}</p>
                  <p className="font-semibold text-hive-charcoal">Area Size</p><p className="text-hive-slate">{Number(property?.areaSize || 0)} sq.ft</p>
                  <p className="font-semibold text-hive-charcoal">Garage</p><p className="text-hive-slate">{Number(property?.garage || 0)}</p>
                  <p className="font-semibold text-hive-charcoal">Floors</p><p className="text-hive-slate">{Number(property?.floorCount || 0)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Nearby Facilities</h2>
                <ul className="mt-3 space-y-2 text-sm text-hive-slate">
                  <li>{property?.nearbySchool ? "✔" : "✖"} School</li>
                  <li>{property?.nearbyHospital ? "✔" : "✖"} Hospital</li>
                  <li>{property?.nearbyMarket ? "✔" : "✖"} Market</li>
                  <li>{property?.nearbyMosque ? "✔" : "✖"} Mosque</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Construction Timeline</h2>
                <ul className="mt-3 space-y-2 text-sm text-hive-slate">
                  {timelineStages.map((stage, idx) => (
                    <li key={stage}>
                      {(currentStageIndex >= idx && currentStageIndex !== -1) ? "✔" : "⏳"} {humanizeKebab(stage)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Exit &amp; Security Rules</h2>
                <ul className="mt-3 space-y-2 text-sm text-hive-slate">
                  <li>✔ Investor Protection Enabled: {formatYesNo(property?.investorProtectionEnabled !== false)}</li>
                  <li>✔ Early Withdrawal Allowed: {formatYesNo(property?.earlyWithdrawalAllowed !== false)}</li>
                  <li>✔ Early Withdrawal Profit: {formatEarlyWithdrawalProfitRule(property?.earlyWithdrawalProfitRule)}</li>
                  <li>✔ Original Investment Protection</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Profit Distribution</h2>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[220px_1fr]">
                  <p className="font-semibold text-hive-charcoal">Investors Share</p><p className="text-hive-slate">{Number(property?.investorProfitSharePct ?? 75)}%</p>
                  <p className="font-semibold text-hive-charcoal">Hive Share</p><p className="text-hive-slate">{Number(property?.hiveProfitSharePct ?? 25)}%</p>
                </div>
              </div>

              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                <h2 className="text-base font-semibold text-hive-charcoal">Property Gallery</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(galleryIndexes ?? []).map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className="relative h-20 overflow-hidden rounded-xl border border-hive-taupe/20"
                    >
                      <img src={thumbSrc(idx)} alt={`Property image ${idx + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-charcoal p-6 text-hive-light">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-hive-taupe">Start Investment</h3>
                <p className="mt-3 text-sm text-hive-light/80">
                  Minimum Investment: <span className="font-semibold text-hive-light">{formatPlainCurrency(minimumInvestmentNum)}</span>
                </p>
                <label className="mt-4 block text-sm font-semibold text-hive-light">Enter Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/30 bg-hive-slate px-3 py-2 text-sm text-hive-light outline-none focus:border-hive-taupe"
                  placeholder="100000"
                  inputMode="numeric"
                />
                <label className="mt-4 block text-sm font-semibold text-hive-light">Upload Payment Proof</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/30 bg-hive-slate px-3 py-2 text-sm text-hive-light"
                />
                {paymentScreenshot ? (
                  <p className="mt-1 text-xs text-hive-light/70">Selected: {paymentScreenshot.name}</p>
                ) : null}
                <button
                  type="button"
                  disabled={checkingAuth || !canInvest}
                  onClick={() => {
                    if (!canInvest) return;
                    if (!isLoggedIn) {
                      goToLoginToInvest();
                      return;
                    }
                    setShowInvestModal(true);
                  }}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Invest Now
                </button>
                <Link
                  href="/properties"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                >
                  Back to Properties
                </Link>
              </div>
            </aside>
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
                  <div className="font-semibold text-hive-charcoal">
                    Available Funding Needed: {formatPlainCurrency(availableFundingNeeded)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Enter Investment Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder="100000"
                  inputMode="numeric"
                />
              </div>

              <fieldset className="rounded-xl border border-hive-taupe/20 p-4">
                <legend className="px-1 text-sm font-semibold text-hive-charcoal">Payment Method</legend>
                <div className="mt-2 grid gap-2 text-sm text-hive-slate">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank-transfer"
                      checked={paymentMethod === "bank-transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    Bank Transfer
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="easypaisa"
                      checked={paymentMethod === "easypaisa"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    EasyPaisa
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="jazzcash"
                      checked={paymentMethod === "jazzcash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    JazzCash
                  </label>
                </div>
              </fieldset>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Upload Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal"
                />
                {paymentScreenshot ? (
                  <p className="mt-1 text-xs text-hive-slate">Selected: {paymentScreenshot.name}</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-hive-taupe/20 bg-hive-light p-4 text-sm text-hive-slate">
                <p>
                  Your Estimated Share:{" "}
                  <span className="font-semibold text-hive-charcoal">
                    {estimatedSharePct > 0 ? `${estimatedSharePct.toFixed(2)}%` : "0%"}
                  </span>
                </p>
                <p className="mt-1">
                  Estimated Profit:{" "}
                  <span className="font-semibold text-hive-charcoal">
                    {formatPlainCurrency(estimatedProfitAmount)}
                  </span>
                </p>
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
                  {investSubmitting ? "Submitting..." : "Confirm Investment"}
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
