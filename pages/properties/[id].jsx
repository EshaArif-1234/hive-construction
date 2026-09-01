import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";

import StatusBadge from "@/components/StatusBadge";
import PropertyInvestorsSection, { InvestorAvatarStack } from "@/components/PropertyInvestorProfile";
import WebsiteFooter from "@/components/WebsiteFooter";
import { buildInvestorLoginRoute, buildInvestorSignupRoute } from "@/lib/investorAuthRedirect";
import { computeFundingProgressPct, computeInvestorPoolProgressPct } from "@/lib/fundingProgress";

function formatMinimumInvestment(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "No minimum";
  return formatPlainCurrency(n);
}

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

function SectionCard({ eyebrow, title, children, className = "" }) {
  return (
    <div
      className={
        "overflow-hidden rounded-3xl border border-hive-taupe/20 bg-gradient-to-br from-hive-light via-white to-hive-taupe/[0.04] p-6 shadow-sm " +
        className
      }
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">{eyebrow}</p>
      ) : null}
      {title ? <h2 className="mt-1 text-lg font-semibold text-hive-charcoal">{title}</h2> : null}
      {children}
    </div>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-hive-taupe/15 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-hive-slate/70">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-hive-charcoal">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-hive-slate">{hint}</p> : null}
    </div>
  );
}

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { id, invest } = router.query;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank-transfer");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [investError, setInvestError] = useState("");
  const [investSuccess, setInvestSuccess] = useState("");
  const [investSubmitting, setInvestSubmitting] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const mapPropertyResponse = (p) => {
    if (!p) return null;
    const totalCost = Number(p.totalCost || 0);
    const required = Number(p.investorFundingRequired || 0);
    const collected = Number(p.fundingCollected || 0);
    const remaining = Number.isFinite(Number(p.remainingFunding))
      ? Number(p.remainingFunding)
      : Math.max(0, required - collected);
    const fundingProgressPct = computeFundingProgressPct(collected, {
      totalCost,
      investorFundingRequired: required,
    });

    return {
      ...p,
      totalCost,
      location: p.city || "",
      fullAddress: p.address || "",
      investorContribution: p.investorFundingRequired,
      currentFundingCollected: collected,
      remainingFunding: remaining,
      investorCount: Number(p.investorCount || 0),
      activeInvestors: Array.isArray(p.investors) ? p.investors : [],
      isFullyFunded: Boolean(p.isFullyFunded) || (required > 0 && remaining <= 0),
      minimumInvestmentAllowed: p.minimumInvestment,
      investorProfitSharePct: p.investorProfitShare,
      hiveProfitSharePct: p.hiveProfitShare,
      expectedCompletionDurationMonths: p.expectedCompletionDuration,
      expectedSellingDurationMonths: p.expectedSellingDuration,
      earlyWithdrawalProfitRule: p.earlyWithdrawalProfit,
      featuredProperty: p.featured,
      fundingProgressPct,
      status: p.listingStatus,
    };
  };

  const loadProperty = async (propertyId) => {
    const res = await fetch(`/api/properties/${propertyId}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || "Unable to load property.");
    }
    return mapPropertyResponse(data?.property || null);
  };

  useEffect(() => {
    if (typeof id !== "string" || !id) return;
    let cancelled = false;
    const run = async () => {
      setError("");
      setLoading(true);
      try {
        const mapped = await loadProperty(id);
        if (!cancelled) {
          setProperty(mapped);
          setActiveIndex(0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Unable to load property.");
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

    const checkAuth = async () => {
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

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router.asPath]);

  const propertyId = typeof id === "string" ? id : "";

  const acceptsConstruction =
    property?.listingStatus === "active" &&
    ["under-construction", "gray-structure-completed", "finishing-work", "land-purchased"].includes(
      String(property?.constructionStatus || "")
    );

  const canInvest = acceptsConstruction && !property?.isFullyFunded;
  const canSubmitInvestment = canInvest && isLoggedIn && !checkingAuth;

  const goToLoginToInvest = useCallback(() => {
    if (!propertyId) return;
    router.push(buildInvestorLoginRoute(propertyId));
  }, [propertyId, router]);

  const handleInvestClick = useCallback(() => {
    if (checkingAuth) return;
    if (!canInvest) return;
    if (!isLoggedIn) {
      goToLoginToInvest();
      return;
    }
    setShowInvestModal(true);
  }, [checkingAuth, canInvest, isLoggedIn, goToLoginToInvest]);

  useEffect(() => {
    if (!router.isReady || invest !== "1" || checkingAuth) return;
    if (!isLoggedIn) {
      goToLoginToInvest();
      return;
    }
    if (canInvest) {
      setShowInvestModal(true);
      if (propertyId) {
        router.replace(`/properties/${propertyId}`, undefined, { shallow: true });
      }
    }
  }, [router.isReady, invest, isLoggedIn, canInvest, checkingAuth, goToLoginToInvest, propertyId, router]);

  const onInvest = async (e) => {
    e.preventDefault();
    setInvestError("");
    setInvestSuccess("");
    if (investSubmitting) return;

    if (!isLoggedIn) {
      goToLoginToInvest();
      return;
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setInvestError("Please enter a valid positive amount.");
      return;
    }

    const minInv = Number(property?.minimumInvestmentAllowed || property?.minimumInvestment || 0);
    if (minInv > 0 && amt < minInv) {
      setInvestError(`Minimum investment is ${formatPlainCurrency(minInv)}.`);
      return;
    }

    const remaining = Number(property?.remainingFunding || 0);
    if (remaining > 0 && amt > remaining) {
      setInvestError(`Amount exceeds remaining funding (${formatPlainCurrency(remaining)} available).`);
      return;
    }

    if (property?.isFullyFunded) {
      setInvestError("This property is fully funded.");
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

      setInvestSuccess("Investment submitted successfully.");
      setAmount("");
      setPaymentMethod("bank-transfer");
      setPaymentScreenshot(null);
      setShowInvestModal(false);

      try {
        const refreshed = await loadProperty(property.id);
        setProperty(refreshed);
      } catch {
        // list refresh is best-effort after invest
      }

      setTimeout(() => {
        router.push("/investor/investments");
      }, 1200);
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
  const remainingFundingNum = Number(property?.remainingFunding ?? Math.max(0, investorContributionNum - currentFundingCollectedNum));
  const investorCountNum = Number(property?.investorCount || 0);
  const activeInvestors = Array.isArray(property?.activeInvestors) ? property.activeInvestors : [];
  const hiveContributionNum = Number(property?.hiveContribution || 0);
  const minimumInvestmentNum = Number(property?.minimumInvestmentAllowed || property?.minimumInvestment || 0);
  const fundingProgressNum = Math.min(
    100,
    Math.max(
      0,
      computeFundingProgressPct(currentFundingCollectedNum, {
        totalCost: totalCostNum,
        investorFundingRequired: investorContributionNum,
      })
    )
  );
  const fundingProgressDenominatorNum =
    totalCostNum > 0 ? totalCostNum : investorContributionNum;
  const investorProfitSharePct = Number(property?.investorProfitSharePct ?? 75);
  const hiveProfitSharePct = Number(property?.hiveProfitSharePct ?? 25);
  const investorPoolProgressNum = computeInvestorPoolProgressPct(
    currentFundingCollectedNum,
    investorContributionNum
  );
  const estimatedSharePct =
    Number.isFinite(Number(amount)) && Number(amount) > 0 && investorContributionNum > 0
      ? (Number(amount) / investorContributionNum) * 100
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

      <section className="pb-16">
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          ) : null}
          {loading ? (
            <div className="mb-6 animate-pulse rounded-3xl border border-hive-taupe/20 bg-hive-light p-8 text-center text-sm text-hive-slate">
              Loading property details…
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_360px]">
            <div className="space-y-6">
              <div className="group relative isolate overflow-hidden rounded-3xl border border-hive-taupe/20 bg-zinc-100 shadow-lg">
                <div className="relative h-72 w-full sm:h-[28rem]">
                  {String(activeImage).startsWith("/api/") || String(activeImage).startsWith("data:") ? (
                    <img
                      src={activeImage}
                      alt={`${property?.title ?? "Property"} image`}
                      className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <Image
                      src={activeImage}
                      alt={`${property?.title ?? "Property"} image`}
                      fill
                      className="z-0 object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 100vw, 70vw"
                    />
                  )}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-hive-charcoal/85 via-hive-charcoal/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 z-20 p-6 sm:p-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-hive-taupe">
                          {humanizeKebab(property?.type)} · {property?.location}
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                          {property?.title}
                        </h1>
                        <p className="mt-2 text-sm text-white/75">
                          {formatRiskLevel(property?.riskLevel)} risk · {humanizeKebab(property?.constructionStatus)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={formatStatus(property?.status)} />
                        {property?.isFullyFunded ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            Fully funded
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                {property?.featuredProperty ? (
                  <div className="absolute right-4 top-4 z-20 rounded-full bg-hive-taupe px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-hive-charcoal shadow-md">
                    Featured
                  </div>
                ) : null}
                {(galleryIndexes ?? []).length > 1 ? (
                  <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-28">
                    {(galleryIndexes ?? []).slice(0, 6).map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Show image ${idx + 1}`}
                        className={
                          "h-2 rounded-full transition-all " +
                          (activeIndex === idx ? "w-8 bg-hive-taupe" : "w-2 bg-white/50 hover:bg-white/80")
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <SectionCard eyebrow="Highlights" title={null}>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-hive-taupe/30 bg-hive-taupe/15 px-4 py-1.5 text-xs font-semibold text-hive-charcoal shadow-sm">
                    {investorProfitSharePct}% / {hiveProfitSharePct}% profit split
                  </span>
                  <span className="rounded-full border border-hive-taupe/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-hive-slate shadow-sm">
                    Min. {formatMinimumInvestment(minimumInvestmentNum)}
                  </span>
                  <span className="rounded-full border border-hive-taupe/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-hive-slate shadow-sm">
                    {property?.expectedCompletionDurationMonths || 0} months
                  </span>
                  {activeInvestors.length > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-hive-taupe/20 bg-white/80 px-3 py-1.5 shadow-sm">
                      <InvestorAvatarStack investors={activeInvestors} max={3} />
                      <span className="text-xs font-semibold text-hive-charcoal">
                        {investorCountNum} investor{investorCountNum === 1 ? "" : "s"}
                      </span>
                    </span>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Overview" title="Property Overview">
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Type", humanizeKebab(property?.type)],
                    ["City", property?.location || "N/A"],
                    ["Address", property?.fullAddress || "N/A"],
                    ["Construction", humanizeKebab(property?.constructionStatus)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-hive-taupe/10 bg-white/60 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-hive-slate/70">{label}</p>
                      <p className="mt-1 text-sm font-medium text-hive-charcoal">{value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Financials" title="Financial Information">
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <StatTile label="Total cost" value={formatPlainCurrency(totalCostNum)} />
                  <StatTile label="Investor funding" value={formatPlainCurrency(investorContributionNum)} />
                  <StatTile label="Hive contribution" value={formatPlainCurrency(hiveContributionNum)} />
                  <StatTile label="Minimum investment" value={formatMinimumInvestment(minimumInvestmentNum)} />
                  <StatTile
                    label="Profit split"
                    value={`${investorProfitSharePct}% / ${hiveProfitSharePct}%`}
                    hint="Investors / Hive"
                  />
                  <StatTile
                    label="Expected duration"
                    value={`${property?.expectedCompletionDurationMonths || 0} months`}
                  />
                </div>
              </SectionCard>

              <SectionCard eyebrow="Funding" title="Funding Progress">
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {property?.isFullyFunded ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                      Fully funded
                    </span>
                  ) : (
                    <span className="rounded-full bg-hive-taupe/15 px-3 py-1 text-xs font-semibold text-hive-charcoal">
                      {fundingProgressNum.toFixed(1)}% funded
                    </span>
                  )}
                </div>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-200/80 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-hive-taupe via-amber-400 to-hive-taupe transition-all duration-700 ease-out"
                    style={{ width: `${fundingProgressNum}%` }}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatTile label="Raised" value={formatPlainCurrency(currentFundingCollectedNum)} />
                  <StatTile label="Remaining" value={formatPlainCurrency(remainingFundingNum)} />
                  <StatTile label="Investors" value={String(investorCountNum)} />
                </div>
                <p className="mt-4 text-sm text-hive-slate">
                  {formatPlainCurrency(currentFundingCollectedNum)} raised of{" "}
                  {formatPlainCurrency(fundingProgressDenominatorNum)} total project cost
                </p>
                {investorContributionNum > 0 ? (
                  <p className="mt-1 text-xs text-hive-slate/80">
                    Investor pool: {formatPlainCurrency(currentFundingCollectedNum)} of{" "}
                    {formatPlainCurrency(investorContributionNum)} ({investorPoolProgressNum.toFixed(1)}%)
                  </p>
                ) : null}
              </SectionCard>

              <PropertyInvestorsSection investors={activeInvestors} investorCount={investorCountNum} />

              <SectionCard eyebrow="Calculator" title="Investment Preview">
                <label className="mt-4 block text-sm font-semibold text-hive-charcoal">Enter investment amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-hive-taupe/20 bg-white/80 px-4 py-3 text-sm text-hive-charcoal shadow-sm outline-none transition focus:border-hive-taupe focus:ring-2 focus:ring-hive-taupe/20"
                  placeholder={minimumInvestmentNum > 0 ? String(minimumInvestmentNum) : "100000"}
                  inputMode="numeric"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatTile label="Pool ownership" value={`${estimatedSharePct.toFixed(2)}%`} />
                  <StatTile
                    label="Profit split"
                    value={`${investorProfitSharePct}% / ${hiveProfitSharePct}%`}
                  />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-hive-slate/80">
                  Minimum investment: {formatMinimumInvestment(minimumInvestmentNum)}. When the property generates profit,
                  {` ${investorProfitSharePct}%`} is shared among investors based on each person&apos;s pool share.
                </p>
              </SectionCard>

              <SectionCard eyebrow="About" title="Property Description">
                <p className="mt-4 text-sm leading-7 text-hive-slate">
                  {property?.description || "No description provided yet."}
                </p>
              </SectionCard>

              <SectionCard eyebrow="Specs" title="Property Features">
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Bedrooms", Number(property?.bedrooms || 0), "🛏"],
                    ["Bathrooms", Number(property?.bathrooms || 0), "🚿"],
                    ["Area", `${Number(property?.areaSize || 0)} sq.ft`, "📐"],
                    ["Garage", Number(property?.garage || 0), "🚗"],
                    ["Floors", Number(property?.floorCount || 0), "🏢"],
                  ].map(([label, value, icon]) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-2xl border border-hive-taupe/10 bg-white/70 px-4 py-3 shadow-sm"
                    >
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-hive-slate/70">{label}</p>
                        <p className="text-sm font-bold text-hive-charcoal">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Location" title="Nearby Facilities">
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    ["School", property?.nearbySchool],
                    ["Hospital", property?.nearbyHospital],
                    ["Market", property?.nearbyMarket],
                    ["Mosque", property?.nearbyMosque],
                  ].map(([label, enabled]) => (
                    <span
                      key={label}
                      className={
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-sm " +
                        (enabled
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border border-hive-taupe/15 bg-neutral-100 text-hive-slate")
                      }
                    >
                      {enabled ? "✓" : "—"} {label}
                    </span>
                  ))}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Progress" title="Construction Timeline">
                <div className="mt-6 space-y-0">
                  {timelineStages.map((stage, idx) => {
                    const done = currentStageIndex >= idx && currentStageIndex !== -1;
                    const current = currentStageIndex === idx;
                    return (
                      <div key={stage} className="relative flex gap-4 pb-6 last:pb-0">
                        {idx < timelineStages.length - 1 ? (
                          <div
                            className={
                              "absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-0.5 " +
                              (done ? "bg-hive-taupe" : "bg-hive-taupe/20")
                            }
                          />
                        ) : null}
                        <div
                          className={
                            "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
                            (done
                              ? "bg-hive-taupe text-hive-charcoal shadow-sm"
                              : "border-2 border-hive-taupe/30 bg-white text-hive-slate")
                          }
                        >
                          {done ? "✓" : idx + 1}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p
                            className={
                              "text-sm font-semibold " +
                              (current ? "text-hive-taupe" : done ? "text-hive-charcoal" : "text-hive-slate")
                            }
                          >
                            {humanizeKebab(stage)}
                          </p>
                          {current ? (
                            <p className="mt-0.5 text-xs font-medium text-hive-taupe">Current stage</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Policy" title="Exit & Security Rules">
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Investor protection", formatYesNo(property?.investorProtectionEnabled !== false)],
                    ["Early withdrawal", formatYesNo(property?.earlyWithdrawalAllowed !== false)],
                    [
                      "Withdrawal profit",
                      formatEarlyWithdrawalProfitRule(property?.earlyWithdrawalProfitRule),
                    ],
                    ["Principal protection", "Enabled"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-hive-taupe/10 bg-white/60 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-hive-slate/70">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-hive-charcoal">{value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Gallery" title="Property Gallery">
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(galleryIndexes ?? []).map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={
                        "group relative h-24 overflow-hidden rounded-2xl border-2 transition-all duration-200 " +
                        (activeIndex === idx
                          ? "border-hive-taupe shadow-lg ring-2 ring-hive-taupe/30"
                          : "border-hive-taupe/20 hover:border-hive-taupe/50")
                      }
                    >
                      <img
                        src={thumbSrc(idx)}
                        alt={`Property image ${idx + 1}`}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="overflow-hidden rounded-3xl border border-hive-taupe/20 bg-gradient-to-br from-hive-charcoal via-hive-charcoal to-hive-slate p-6 text-hive-light shadow-xl">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-hive-taupe">Start Investment</h3>

                {activeInvestors.length > 0 ? (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-hive-taupe/25 bg-white/5 p-3 backdrop-blur-sm">
                    <InvestorAvatarStack investors={activeInvestors} max={5} />
                    <p className="text-xs text-hive-light/75">
                      <span className="font-bold text-hive-light">{investorCountNum}</span> backing this property
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 space-y-3 rounded-2xl border border-hive-taupe/25 bg-hive-slate/40 p-4 text-sm backdrop-blur-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-hive-light/75">Raised</span>
                    <span className="font-semibold tabular-nums">{formatPlainCurrency(currentFundingCollectedNum)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-hive-light/75">Remaining</span>
                    <span className="font-semibold tabular-nums">{formatPlainCurrency(remainingFundingNum)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-hive-light/75">Investors</span>
                    <span className="font-semibold tabular-nums">{investorCountNum}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-hive-charcoal/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-hive-taupe to-amber-300 transition-all duration-700"
                      style={{ width: `${fundingProgressNum}%` }}
                    />
                  </div>
                  <p className="text-xs text-hive-light/70">
                    {fundingProgressNum.toFixed(1)}% of total cost · Pool {investorPoolProgressNum.toFixed(1)}%
                  </p>
                </div>

                <div className="mt-4 space-y-2 rounded-xl border border-hive-taupe/25 bg-hive-slate/30 p-3 text-xs text-hive-light/85">
                  <div className="flex justify-between gap-3">
                    <span>Profit split</span>
                    <span className="font-semibold text-hive-light">
                      {investorProfitSharePct}% / {hiveProfitSharePct}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Minimum investment</span>
                    <span className="font-semibold text-hive-light">
                      {formatMinimumInvestment(minimumInvestmentNum)}
                    </span>
                  </div>
                </div>

                {property?.isFullyFunded ? (
                  <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-3 text-sm text-emerald-100">
                    This property is fully funded. New investments are closed.
                  </div>
                ) : null}

                {checkingAuth ? (
                  <p className="mt-4 text-xs text-hive-light/70">Checking your session…</p>
                ) : !isLoggedIn ? (
                  <p className="mt-4 text-xs leading-relaxed text-hive-light/70">
                    Sign in as an investor to invest in this property.
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={checkingAuth || !canInvest}
                  onClick={handleInvestClick}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-hive-taupe to-amber-300 px-4 py-3 text-sm font-bold text-hive-charcoal shadow-lg transition-all hover:shadow-xl hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkingAuth
                    ? "Checking session…"
                    : !isLoggedIn
                      ? "Invest Now"
                      : property?.isFullyFunded
                        ? "Funding complete"
                        : "Invest Now"}
                </button>

                {!checkingAuth && !isLoggedIn && propertyId ? (
                  <Link
                    href={buildInvestorSignupRoute(propertyId)}
                    className="mt-2 inline-flex w-full items-center justify-center text-xs font-semibold text-hive-taupe underline hover:text-hive-light"
                  >
                    New investor? Create an account
                  </Link>
                ) : null}
                <Link
                  href="/properties"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                >
                  Back to Properties
                </Link>
              </div>
            </aside>
          </div>
      </section>

      {showInvestModal && isLoggedIn ? (
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
                    Remaining funding: {formatPlainCurrency(remainingFundingNum)}
                  </div>
                  <p className="mt-1 text-xs">
                    {investorCountNum} investor{investorCountNum === 1 ? "" : "s"}
                    {minimumInvestmentNum > 0 ? ` · Min. ${formatMinimumInvestment(minimumInvestmentNum)}` : " · No minimum investment"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">Enter Investment Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  placeholder={minimumInvestmentNum > 0 ? String(minimumInvestmentNum) : "100000"}
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
                  Profit split:{" "}
                  <span className="font-semibold text-hive-charcoal">
                    {investorProfitSharePct}% Investors / {hiveProfitSharePct}% Hive
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
                  disabled={investSubmitting || !canSubmitInvestment}
                  className={
                    "rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe disabled:cursor-not-allowed disabled:opacity-60 " +
                    (investSubmitting ? "opacity-70" : "")
                  }
                >
                  {investSubmitting ? "Submitting..." : property?.isFullyFunded ? "Funding complete" : "Confirm Investment"}
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
