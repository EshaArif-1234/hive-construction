import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

function formatStatus(status) {
  if (status === "available") return "Available";
  if (status === "in-progress") return "In Progress";
  if (status === "sold") return "Sold";
  return "Available";
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `PKR ${n.toLocaleString()}`;
}

export default function AdminPropertiesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [constructionCost, setConstructionCost] = useState("");
  const [landCost, setLandCost] = useState("");
  const [expectedSalePrice, setExpectedSalePrice] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("available");
  const [images, setImages] = useState([]);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/properties");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to load properties.");
        setProperties([]);
        return;
      }
      setProperties(Array.isArray(data?.properties) ? data.properties : []);
    } catch (e) {
      setError("Unable to load properties.");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = () => {
    setModalError("");
    setTitle("");
    setLocation("");
    setTotalCost("");
    setConstructionCost("");
    setLandCost("");
    setExpectedSalePrice("");
    setPropertyStatus("available");
    setImages([]);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setModalError("");
    if (submitting) return;

    const t = title.trim();
    const loc = location.trim();
    if (!t || !loc) {
      setModalError("Please fill in title and location.");
      return;
    }

    const tc = Number(totalCost);
    const cc = Number(constructionCost);
    const lc = Number(landCost);
    const esp = Number(expectedSalePrice);

    if (!Number.isFinite(tc) || !Number.isFinite(cc) || !Number.isFinite(lc) || !Number.isFinite(esp)) {
      setModalError("Please enter valid numbers for costs and expected sale price.");
      return;
    }

    if (!images || images.length < 1) {
      setModalError("Please upload at least 1 image.");
      return;
    }

    if (images.length > 5) {
      setModalError("Maximum 5 images are allowed.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", t);
      fd.append("location", loc);
      fd.append("totalCost", String(tc));
      fd.append("constructionCost", String(cc));
      fd.append("landCost", String(lc));
      fd.append("status", String(propertyStatus || "available"));
      fd.append("expectedSalePrice", String(esp));
      Array.from(images).forEach((file) => {
        fd.append("images", file);
      });

      const res = await fetch("/api/admin/properties", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModalError(data?.message || "Unable to create property.");
        return;
      }

      if (data?.property) {
        setProperties((prev) => [data.property, ...prev]);
      } else {
        await load();
      }

      setShowModal(false);
    } catch (e) {
      setModalError("Unable to create property.");
    } finally {
      setSubmitting(false);
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return properties.filter((p) => {
      const displayStatus = formatStatus(p.status);
      const matchesQuery = q
        ? `${p.title} ${p.location} ${p.id}`.toLowerCase().includes(q)
        : true;

      const matchesStatus = status === "All" ? true : displayStatus === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, status, properties]);

  return (
    <>
      <Head>
        <title>Admin Properties | Hive Construction</title>
      </Head>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              Property Management
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">
              Properties
            </h1>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              View, edit, or delete property listings. (UI only for now)
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
          >
            Add Property
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
            placeholder="Search by title, location, or id"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
          >
            <option value="All">All statuses</option>
            <option value="Available">Available</option>
            <option value="In Progress">In Progress</option>
            <option value="Sold">Sold</option>
          </select>

          <div className="rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-slate">
            {loading ? (
              <span className="font-semibold text-hive-charcoal">Loading...</span>
            ) : (
              <>
                Showing <span className="font-semibold text-hive-charcoal">{rows.length}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-hive-taupe/20">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-hive-charcoal">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Total Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="odd:bg-hive-light even:bg-hive-light">
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-hive-charcoal">
                          {p.title}
                        </p>
                        <p className="mt-1 text-xs text-hive-slate">{p.id}</p>
                        <p className="mt-1 text-xs text-hive-slate">
                          Images: <span className="font-semibold text-hive-charcoal">{p.imagesCount ?? 0}</span>
                        </p>
                      </div>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {p.location}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <StatusBadge status={formatStatus(p.status)} />
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold text-hive-charcoal">
                      {formatCurrency(p.totalCost)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="border-t border-hive-taupe/20 px-4 py-10 text-center text-sm text-hive-slate"
                    >
                      No properties match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl bg-hive-light p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Property
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-hive-charcoal">
                  Add Property
                </h2>
                <p className="mt-1 text-sm text-hive-slate">
                  Upload 1 to 5 images and fill all required fields.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Close
              </button>
            </div>

            <form onSubmit={onCreate} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="Property title"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="City / Area"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Total Cost</label>
                  <input
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="8500000"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Expected Sale Price</label>
                  <input
                    value={expectedSalePrice}
                    onChange={(e) => setExpectedSalePrice(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="10000000"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Construction Cost</label>
                  <input
                    value={constructionCost}
                    onChange={(e) => setConstructionCost(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="4500000"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Land Cost</label>
                  <input
                    value={landCost}
                    onChange={(e) => setLandCost(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                    placeholder="4000000"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Status</label>
                  <select
                    value={propertyStatus}
                    onChange={(e) => setPropertyStatus(e.target.value)}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  >
                    <option value="available">Available</option>
                    <option value="in-progress">In Progress</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-hive-charcoal">Images (max 5)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setImages(files);
                    }}
                    className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
                  />
                  <p className="mt-1 text-xs text-hive-slate">
                    Selected: <span className="font-semibold text-hive-charcoal">{images?.length || 0}</span>
                  </p>
                </div>
              </div>

              {modalError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {modalError}
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-hive-charcoal px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={
                    "rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe " +
                    (submitting ? "opacity-70" : "")
                  }
                >
                  {submitting ? "Creating..." : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
