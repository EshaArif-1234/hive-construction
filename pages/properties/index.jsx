import Head from "next/head";
import { useMemo, useState } from "react";

import PropertyCard from "@/components/PropertyCard";
import WebsiteFooter from "@/components/WebsiteFooter";

const PROPERTIES = [
  {
    id: "lahore-01",
    title: "Lahore Residential Build",
    location: "Lahore",
    priceValue: 8500000,
    priceLabel: "PKR 8,500,000 (Est.)",
    status: "Available",
  },
  {
    id: "islamabad-01",
    title: "Islamabad Land + Construction",
    location: "Islamabad",
    priceValue: 12500000,
    priceLabel: "PKR 12,500,000 (Est.)",
    status: "In Progress",
  },
  {
    id: "karachi-01",
    title: "Karachi Residential Sale",
    location: "Karachi",
    priceValue: 9700000,
    priceLabel: "PKR 9,700,000 (Est.)",
    status: "Sold",
  },
  {
    id: "rawalpindi-01",
    title: "Rawalpindi Residential Opportunity",
    location: "Rawalpindi",
    priceValue: 6500000,
    priceLabel: "PKR 6,500,000 (Est.)",
    status: "Available",
  },
  {
    id: "multan-01",
    title: "Multan Residential Development",
    location: "Multan",
    priceValue: 5200000,
    priceLabel: "PKR 5,200,000 (Est.)",
    status: "Available",
  },
  {
    id: "faisalabad-01",
    title: "Faisalabad Project",
    location: "Faisalabad",
    priceValue: 7600000,
    priceLabel: "PKR 7,600,000 (Est.)",
    status: "In Progress",
  },
];

function parsePriceRange(range) {
  if (range === "under_7m") return { min: 0, max: 7000000 };
  if (range === "7m_10m") return { min: 7000000, max: 10000000 };
  if (range === "above_10m") return { min: 10000000, max: Infinity };
  return { min: 0, max: Infinity };
}

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [status, setStatus] = useState("all");
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const { min, max } = parsePriceRange(priceRange);

    return PROPERTIES.filter((p) => {
      const matchesSearch =
        !s ||
        p.title.toLowerCase().includes(s) ||
        p.location.toLowerCase().includes(s);

      const matchesStatus = status === "all" ? true : p.status === status;

      const matchesPrice = p.priceValue >= min && p.priceValue < max;

      return matchesSearch && matchesStatus && matchesPrice;
    });
  }, [search, priceRange, status]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  function clearFilters() {
    setSearch("");
    setPriceRange("all");
    setStatus("all");
    setVisibleCount(6);
  }

  return (
    <>
      <Head>
        <title>Available Properties | Hive Construction Ventures</title>
        <meta
          name="description"
          content="Browse available residential construction investment opportunities with search and filters. View status, estimated market value, and project details in a read-only listing."
        />
        <link rel="canonical" href="/properties" />
      </Head>

      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Listings
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-hive-charcoal sm:text-5xl">
              Available Properties
            </h1>
            <p className="mt-5 text-base leading-7 text-hive-slate sm:text-lg">
              Explore secured investment opportunities in residential construction projects. Filter by location, price range, and status to find the right opportunity.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-hive-charcoal">
                  Search by location
                </label>
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setVisibleCount(6);
                  }}
                  placeholder="Search by city or project name"
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-4 py-2.5 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  Price range
                </label>
                <select
                  value={priceRange}
                  onChange={(e) => {
                    setPriceRange(e.target.value);
                    setVisibleCount(6);
                  }}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-4 py-2.5 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                >
                  <option value="all">All</option>
                  <option value="under_7m">Under PKR 7M</option>
                  <option value="7m_10m">PKR 7M – 10M</option>
                  <option value="above_10m">Above PKR 10M</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-hive-charcoal">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setVisibleCount(6);
                  }}
                  className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-4 py-2.5 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                >
                  <option value="all">All</option>
                  <option value="Available">Available</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-hive-slate">
                Showing <span className="font-semibold text-hive-charcoal">{filtered.length}</span> result(s)
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="mt-10">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-10 text-center">
                <p className="text-base font-semibold text-hive-charcoal">
                  No properties found
                </p>
                <p className="mt-2 text-sm text-hive-slate">
                  Try adjusting your search or clearing filters to see more opportunities.
                </p>
                <div className="mt-6">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-6 py-3 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((p) => (
                    <PropertyCard
                      key={p.id}
                      id={p.id}
                      title={p.title}
                      location={p.location}
                      price={p.priceLabel}
                      status={p.status}
                      imageLabel="Property Image"
                    />
                  ))}
                </div>

                <div className="mt-10 flex items-center justify-center">
                  {canLoadMore ? (
                    <button
                      onClick={() => setVisibleCount((c) => c + 6)}
                      className="rounded-md bg-hive-taupe px-6 py-3 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-charcoal hover:text-hive-light"
                    >
                      Load More
                    </button>
                  ) : (
                    <p className="text-sm text-hive-slate">End of results</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </>
  );
}
