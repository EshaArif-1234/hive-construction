import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

function PhotoUploadIllustration() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-hive-taupe/30 bg-gradient-to-br from-hive-charcoal to-neutral-900 shadow-inner ring-1 ring-white/10">
      <svg
        className="h-8 w-8 text-hive-taupe"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
        />
      </svg>
    </div>
  );
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

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [constructionCost, setConstructionCost] = useState("");
  const [landCost, setLandCost] = useState("");
  const [expectedSalePrice, setExpectedSalePrice] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("available");
  const [images, setImages] = useState([]);

  const [deletingId, setDeletingId] = useState("");
  const fileInputRef = useRef(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const entries = images.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImagePreviews(entries);
    return () => {
      entries.forEach((e) => URL.revokeObjectURL(e.url));
    };
  }, [images]);

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

  const onDelete = async (p) => {
    const id = String(p?.id || "");
    if (!id) return;

    const ok = window.confirm(`Delete property "${p?.title || ""}"?`);
    if (!ok) return;

    setError("");
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Unable to delete property.");
        return;
      }

      setProperties((prev) => prev.filter((x) => String(x.id) !== id));
    } catch (e) {
      setError("Unable to delete property.");
    } finally {
      setDeletingId("");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = () => {
    setModalError("");
    setIsEditMode(false);
    setEditingId("");
    setTitle("");
    setLocation("");
    setTotalCost("");
    setConstructionCost("");
    setLandCost("");
    setExpectedSalePrice("");
    setPropertyStatus("available");
    setImages([]);
    setPhotoDragOver(false);
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setModalError("");
    setPhotoDragOver(false);
    setIsEditMode(true);
    setEditingId(String(p?.id || ""));
    setTitle(String(p?.title || ""));
    setLocation(String(p?.location || ""));
    setTotalCost(String(p?.totalCost ?? ""));
    setConstructionCost(String(p?.constructionCost ?? ""));
    setLandCost(String(p?.landCost ?? ""));
    setExpectedSalePrice(String(p?.expectedSalePrice ?? ""));
    setPropertyStatus(String(p?.status || "available"));
    setImages([]);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const handlePickPhotos = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (picked.length === 0) return;
    if (picked.length > 5) {
      setModalError("Choose up to 5 images.");
      return;
    }
    setModalError("");
    setImages(picked.slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        setModalError(
          data?.message ||
            (res.status === 503
              ? "Image uploads require Cloudinary credentials in server environment."
              : "Unable to create property.")
        );
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

  const onUpdate = async (e) => {
    e.preventDefault();
    setModalError("");
    if (submitting) return;

    if (!editingId) {
      setModalError("Invalid property id.");
      return;
    }

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

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/properties/${editingId}` , {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          location: loc,
          totalCost: tc,
          constructionCost: cc,
          landCost: lc,
          status: String(propertyStatus || "available"),
          expectedSalePrice: esp,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModalError(data?.message || "Unable to update property.");
        return;
      }

      if (data?.property) {
        setProperties((prev) => prev.map((x) => (String(x.id) === String(editingId) ? data.property : x)));
      } else {
        await load();
      }

      setShowModal(false);
    } catch (e) {
      setModalError("Unable to update property.");
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
              View, edit, or delete listings. New properties upload images to Cloudinary; URLs are stored in the database.
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
                      <div className="flex items-start gap-3">
                        {p.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.coverImage}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg border border-hive-taupe/25 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-hive-taupe/30 bg-neutral-100">
                            <svg
                              className="h-6 w-6 text-hive-charcoal/25"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.25}
                              aria-hidden
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-hive-charcoal">
                            {p.title}
                          </p>
                          <p className="mt-1 text-xs text-hive-slate">{p.id}</p>
                          <p className="mt-1 text-xs text-hive-slate">
                            Images:{" "}
                            <span className="font-semibold text-hive-charcoal">{p.imagesCount ?? 0}</span>
                          </p>
                        </div>
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
                          onClick={() => openEditModal(p)}
                          className="rounded-md border border-hive-charcoal px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                          disabled={deletingId === String(p.id)}
                          onClick={() => onDelete(p)}
                        >
                          {deletingId === String(p.id) ? "Deleting..." : "Delete"}
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center sm:p-6">
          <div className="my-auto flex min-h-0 w-full max-w-2xl max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-3xl border border-hive-taupe/15 bg-hive-light shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hive-taupe/15 px-6 pt-6 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                  Property
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-hive-charcoal">
                  {isEditMode ? "Edit Property" : "Add Property"}
                </h2>
                <p className="mt-1 text-sm text-hive-slate">
                  {isEditMode
                    ? "Update property details. Image changes use Cloudinary from the create flow only."
                    : "Add 1–5 photos (stored on Cloudinary). Fill all required fields."}
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

            <form
              onSubmit={isEditMode ? onUpdate : onCreate}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 [scrollbar-gutter:stable]">
                {!isEditMode ? (
                  <div className="mb-6">
                    <label className="text-sm font-semibold text-hive-charcoal">Property photos</label>
                    <p className="mt-1 text-xs text-hive-slate">
                      Images upload to Cloudinary; only URLs are saved in MongoDB (max 5).
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handlePickPhotos(e.target.files)}
                    />
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setPhotoDragOver(true);
                      }}
                      onDragLeave={() => setPhotoDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setPhotoDragOver(false);
                        handlePickPhotos(e.dataTransfer.files);
                      }}
                      className={
                        "mt-3 rounded-2xl border-2 border-dashed transition-colors " +
                        (photoDragOver
                          ? "border-hive-taupe bg-hive-taupe/10"
                          : "border-hive-taupe/35 bg-hive-light hover:border-hive-taupe/55 hover:bg-neutral-50")
                      }
                    >
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full cursor-pointer flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:text-left"
                      >
                        <PhotoUploadIllustration />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-hive-charcoal">
                            Upload listing photos
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-hive-slate">
                            Drag and drop images here, or click to browse. JPEG / PNG / WebP — up to 5 files.
                          </p>
                          <p className="mt-3 inline-flex items-center rounded-md bg-hive-charcoal px-4 py-2 text-xs font-semibold text-hive-light">
                            Choose files
                          </p>
                        </div>
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-hive-slate">
                      Selected:{" "}
                      <span className="font-semibold text-hive-charcoal">{images?.length || 0}</span>
                      {images?.length ? (
                        <span className="text-hive-slate">
                          {" "}
                          ({images.map((f) => f.name).join(", ")})
                        </span>
                      ) : null}
                    </p>

                    {imagePreviews.length > 0 ? (
                      <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="Selected image previews">
                        {imagePreviews.map((entry, idx) => (
                          <li
                            key={`${entry.name}-${idx}`}
                            className="relative aspect-square overflow-hidden rounded-xl border border-hive-taupe/25 bg-neutral-100 shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- blob URLs from local files */}
                            <img
                              src={entry.url}
                              alt={entry.name ? `Preview ${entry.name}` : `Preview ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImageAt(idx)}
                              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-sm font-bold leading-none text-white shadow-md hover:bg-red-700"
                              aria-label={`Remove ${entry.name || "image"}`}
                            >
                              ×
                            </button>
                            <p className="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-black/55 px-1.5 py-1 text-[10px] text-white">
                              {entry.name}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

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

              <div className="grid gap-4 sm:max-w-md">
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
              </div>

              {modalError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {modalError}
                </div>
              ) : null}
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-hive-taupe/15 bg-hive-light px-6 py-4">
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
                  {isEditMode
                    ? submitting
                      ? "Saving..."
                      : "Save Changes"
                    : submitting
                      ? "Creating..."
                      : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
