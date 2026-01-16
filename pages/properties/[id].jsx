import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useMemo, useState } from "react";

import InfoCard from "@/components/InfoCard";
import StatusBadge from "@/components/StatusBadge";
import WebsiteFooter from "@/components/WebsiteFooter";

function svgDataUri(label) {
  const safe = String(label ?? "Property").slice(0, 48);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111111"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <text x="60" y="120" fill="#D4AF37" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700">Hive Construction</text>
  <text x="60" y="190" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="34" opacity="0.9">${safe}</text>
  <text x="60" y="248" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="18" opacity="0.7">Image placeholder</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PROPERTY_DB = {
  "lahore-01": {
    id: "lahore-01",
    title: "Lahore Residential Build",
    location: "Lahore",
    status: "Available",
    type: "Residential",
    description:
      "A residential construction opportunity focused on quality build standards, strong resale potential, and documented investor protection.",
    totalCost: "PKR 8,500,000 (Est.)",
    investorContribution: "Investor can participate with any amount (informational).",
    hiveContribution: "Remaining amount covered by Hive (informational).",
    profitShare: "75% Investors / 25% Hive",
    constructionStage: "Foundation & structural planning",
    estimatedCompletion: "8–10 months (estimated)",
    saleStatus: "Not sold",
    galleryLabels: ["Front Elevation", "Interior", "Site Plan", "Neighborhood"],
  },
  "islamabad-01": {
    id: "islamabad-01",
    title: "Islamabad Land + Construction",
    location: "Islamabad",
    status: "In Progress",
    type: "Residential",
    description:
      "Land acquisition with active development planning and phased construction execution, designed for transparent investor reporting.",
    totalCost: "PKR 12,500,000 (Est.)",
    investorContribution: "Investor can participate with any amount (informational).",
    hiveContribution: "Remaining amount covered by Hive (informational).",
    profitShare: "75% Investors / 25% Hive",
    constructionStage: "Construction underway",
    estimatedCompletion: "4–6 months (estimated)",
    saleStatus: "Not sold",
    galleryLabels: ["Site", "Construction", "Floor Plan", "Location"],
  },
  "karachi-01": {
    id: "karachi-01",
    title: "Karachi Residential Sale",
    location: "Karachi",
    status: "Sold",
    type: "Residential",
    description:
      "A completed residential project reflecting Hive’s documented execution and transparent settlement process.",
    totalCost: "PKR 9,700,000 (Est.)",
    investorContribution: "Investor can participate with any amount (informational).",
    hiveContribution: "Remaining amount covered by Hive (informational).",
    profitShare: "75% Investors / 25% Hive",
    constructionStage: "Completed",
    estimatedCompletion: "Completed",
    saleStatus: "Sold",
    galleryLabels: ["Front Elevation", "Living", "Kitchen", "Sold"],
  },
};

export default function PropertyDetailsPage() {
  const router = useRouter();
  const { id, role } = router.query;

  const isInvestor = role === "investor";

  const property = useMemo(() => {
    if (typeof id !== "string") return null;
    return PROPERTY_DB[id] ?? {
      id,
      title: id.replaceAll("-", " "),
      location: "(Location)",
      status: "Available",
      type: "Residential",
      description:
        "Property details are being prepared. This is a read-only preview page.",
      totalCost: "(Estimated total cost)",
      investorContribution: "Investor can participate with any amount (informational).",
      hiveContribution: "Remaining amount covered by Hive (informational).",
      profitShare: "75% Investors / 25% Hive",
      constructionStage: "(Stage)",
      estimatedCompletion: "(Estimated timeline)",
      saleStatus: "(Sale status)",
      galleryLabels: ["Main", "Preview 1", "Preview 2", "Preview 3"],
    };
  }, [id]);

  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = useMemo(() => {
    const label = property?.galleryLabels?.[activeIndex] ?? property?.title;
    return svgDataUri(label);
  }, [property, activeIndex]);

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
                  <StatusBadge status={property?.status} />
                </div>
                <p className="mt-3 text-sm text-hive-slate">
                  {property?.location} • {property?.type}
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
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="grid gap-4">
                    <div className="relative overflow-hidden rounded-2xl bg-hive-charcoal">
                      <div className="relative h-64 w-full sm:h-80">
                        <Image
                          src={activeImage}
                          alt={`${property?.title ?? "Property"} image`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 66vw"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {(property?.galleryLabels ?? []).map((label, idx) => {
                        const src = svgDataUri(label);
                        const isActive = idx === activeIndex;

                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            className={
                              "relative overflow-hidden rounded-xl border transition-colors " +
                              (isActive
                                ? "border-hive-taupe"
                                : "border-hive-taupe/20 hover:border-hive-taupe/60")
                            }
                            aria-label={`View ${label}`}
                          >
                            <div className="relative h-16 w-full">
                              <Image
                                src={src}
                                alt={label}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 25vw, 10vw"
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
                      value={property?.totalCost}
                      subtext="Estimated market value for investor reference."
                    />
                    <InfoCard
                      label="Profit sharing"
                      value={property?.profitShare}
                      subtext="Profit distributed after sale settlement."
                    />
                    <InfoCard
                      label="Status"
                      value={property?.status}
                      subtext="Read-only public project status."
                    />
                  </div>

                  <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
                      <h2 className="text-base font-semibold text-hive-charcoal">
                        Property Overview
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-hive-slate">
                        {property?.description}
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
                          {property?.type}
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
                          {property?.investorContribution}
                        </p>
                        <p>
                          <span className="font-semibold text-hive-charcoal">
                            Hive’s contribution:
                          </span>{" "}
                          {property?.hiveContribution}
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
                    {isInvestor ? (
                      <a
                        href="#"
                        className="inline-flex w-full items-center justify-center rounded-md bg-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
                      >
                        View My Investment
                      </a>
                    ) : (
                      <Link
                        href="/#become-investor"
                        className="inline-flex w-full items-center justify-center rounded-md bg-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
                      >
                        Register to Invest
                      </Link>
                    )}

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

      <WebsiteFooter />
    </>
  );
}
