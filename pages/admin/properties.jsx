import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import AdminPropertyViewModal from "@/components/AdminPropertyViewModal";
import StatusBadge from "@/components/StatusBadge";

function formatStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "draft") return "Draft";
  if (value === "active") return "Active";
  if (value === "paused") return "Paused";
  if (value === "completed") return "Completed";
  if (value === "archived") return "Archived";
  return "Draft";
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `PKR ${n.toLocaleString()}`;
}

function appendPropertyFormFields(fd, fields) {
  fd.append("title", fields.title);
  fd.append("type", fields.type);
  fd.append("city", fields.city);
  fd.append("address", fields.address);
  fd.append("description", fields.description);
  fd.append("totalCost", String(fields.totalCost));
  fd.append("constructionStatus", fields.constructionStatus);
  fd.append("listingStatus", fields.listingStatus);
  fd.append("expectedSellingPrice", String(fields.expectedSellingPrice));
  fd.append("investorFundingRequired", String(fields.investorFundingRequired));
  fd.append("hiveContribution", String(fields.hiveContribution));
  fd.append("expectedProfitPercentage", String(fields.expectedProfitPercentage));
  fd.append("minimumInvestment", String(fields.minimumInvestment));
  fd.append("investorProfitShare", String(fields.investorProfitShare));
  fd.append("hiveProfitShare", String(fields.hiveProfitShare));
  fd.append("expectedCompletionDuration", String(fields.expectedCompletionDuration));
  fd.append("expectedSellingDuration", String(fields.expectedSellingDuration));
  fd.append("fundingCollected", String(fields.fundingCollected));
  fd.append("fundingProgressPct", String(fields.fundingProgressPct));
  fd.append("expectedAnnualRoiPct", String(fields.expectedAnnualRoiPct));
  fd.append("riskLevel", fields.riskLevel);
  fd.append("bedrooms", String(fields.bedrooms));
  fd.append("bathrooms", String(fields.bathrooms));
  fd.append("areaSize", String(fields.areaSize));
  fd.append("garage", String(fields.garage));
  fd.append("floorCount", String(fields.floorCount));
  fd.append("nearbySchool", String(fields.nearbySchool));
  fd.append("nearbyHospital", String(fields.nearbyHospital));
  fd.append("nearbyMarket", String(fields.nearbyMarket));
  fd.append("nearbyMosque", String(fields.nearbyMosque));
  fd.append("investorProtectionEnabled", String(fields.investorProtectionEnabled));
  fd.append("earlyWithdrawalAllowed", String(fields.earlyWithdrawalAllowed));
  fd.append("earlyWithdrawalProfit", fields.earlyWithdrawalProfit);
  fd.append("featured", String(fields.featured));
  fd.append("createdBy", fields.createdBy);
}

export default function AdminPropertiesPage() {
  const normalizeListingStatus = (value) => {
    const v = String(value || "").toLowerCase();
    if (v === "sold") return "completed";
    if (v === "inactive") return "paused";
    if (["draft", "active", "paused", "completed", "archived"].includes(v)) return v;
    return "draft";
  };

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("basic");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("house");
  const [location, setLocation] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [description, setDescription] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [requiredInvestorFunding, setRequiredInvestorFunding] = useState("");
  const [hiveContribution, setHiveContribution] = useState("");
  const [minimumInvestmentAllowed, setMinimumInvestmentAllowed] = useState("");
  const [investorProfitSharePct, setInvestorProfitSharePct] = useState("75");
  const [hiveProfitSharePct, setHiveProfitSharePct] = useState("25");
  const [constructionStatus, setConstructionStatus] = useState("not-started");
  const [expectedCompletionDurationMonths, setExpectedCompletionDurationMonths] = useState("12");
  const [expectedSellingDurationMonths, setExpectedSellingDurationMonths] = useState("6");
  const [investorProtectionEnabled, setInvestorProtectionEnabled] = useState("yes");
  const [earlyWithdrawalAllowed, setEarlyWithdrawalAllowed] = useState("yes");
  const [earlyWithdrawalProfitRule, setEarlyWithdrawalProfitRule] = useState("no-profit");
  const [listingStatus, setListingStatus] = useState("draft");
  const [featuredProperty, setFeaturedProperty] = useState("no");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSize, setAreaSize] = useState("");
  const [garage, setGarage] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [nearbySchool, setNearbySchool] = useState("no");
  const [nearbyHospital, setNearbyHospital] = useState("no");
  const [nearbyMarket, setNearbyMarket] = useState("no");
  const [nearbyMosque, setNearbyMosque] = useState("no");
  const [thumbnailImage, setThumbnailImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [existingMedia, setExistingMedia] = useState({ thumbnail: null, gallery: [] });

  const [deletingId, setDeletingId] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProperty, setViewProperty] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const thumbnailInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  useEffect(() => {
    const entries = [];

    if (thumbnailImage) {
      entries.push({
        url: URL.createObjectURL(thumbnailImage),
        label: thumbnailImage.name,
        revoke: true,
      });
    } else if (existingMedia.thumbnail?.url) {
      entries.push({
        url: existingMedia.thumbnail.url,
        label: "Current thumbnail",
        revoke: false,
      });
    }

    if (galleryImages.length > 0) {
      galleryImages.forEach((file) => {
        entries.push({
          url: URL.createObjectURL(file),
          label: file.name,
          revoke: true,
        });
      });
    } else {
      existingMedia.gallery.forEach((img, idx) => {
        if (!img?.url) return;
        entries.push({
          url: img.url,
          label: `Gallery ${idx + 1}`,
          revoke: false,
        });
      });
    }

    setMediaPreviews(entries);
    return () => {
      entries.forEach((entry) => {
        if (entry.revoke) URL.revokeObjectURL(entry.url);
      });
    };
  }, [thumbnailImage, galleryImages, existingMedia]);

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

  const openViewModal = async (p) => {
    const id = String(p?.id || "");
    if (!id) return;

    setShowViewModal(true);
    setViewProperty(null);
    setViewError("");
    setViewLoading(true);

    try {
      const res = await fetch(`/api/admin/properties/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setViewError(data?.message || "Unable to load property.");
        return;
      }
      setViewProperty(data?.property || null);
    } catch {
      setViewError("Unable to load property.");
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewProperty(null);
    setViewError("");
  };

  const editFromView = (property) => {
    closeViewModal();
    openEditModal(property);
  };

  const openModal = () => {
    setModalError("");
    setModalTab("basic");
    setIsEditMode(false);
    setEditingId("");
    setTitle("");
    setPropertyType("house");
    setLocation("");
    setFullAddress("");
    setDescription("");
    setTotalCost("");
    setRequiredInvestorFunding("");
    setHiveContribution("");
    setMinimumInvestmentAllowed("");
    setInvestorProfitSharePct("75");
    setHiveProfitSharePct("25");
    setConstructionStatus("not-started");
    setExpectedCompletionDurationMonths("12");
    setExpectedSellingDurationMonths("6");
    setInvestorProtectionEnabled("yes");
    setEarlyWithdrawalAllowed("yes");
    setEarlyWithdrawalProfitRule("no-profit");
    setListingStatus("draft");
    setFeaturedProperty("no");
    setRiskLevel("medium");
    setBedrooms("");
    setBathrooms("");
    setAreaSize("");
    setGarage("");
    setFloorCount("");
    setNearbySchool("no");
    setNearbyHospital("no");
    setNearbyMarket("no");
    setNearbyMosque("no");
    setThumbnailImage(null);
    setGalleryImages([]);
    setExistingMedia({ thumbnail: null, gallery: [] });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    const pick = (...values) => {
      for (const v of values) {
        if (v !== undefined && v !== null && String(v) !== "") return v;
      }
      return "";
    };
    setModalError("");
    setModalTab("basic");
    setIsEditMode(true);
    setEditingId(String(p?.id || ""));
    setTitle(String(p?.title || ""));
    setPropertyType(String(pick(p?.type, p?.propertyType, "house")));
    setLocation(String(pick(p?.city, p?.location, "")));
    setFullAddress(String(pick(p?.address, p?.fullAddress, "")));
    setDescription(String(p?.description || ""));
    setTotalCost(String(pick(p?.totalCost, 0)));
    setRequiredInvestorFunding(
      String(pick(p?.investorFundingRequired, p?.requiredInvestorFunding, p?.investorContribution, ""))
    );
    setHiveContribution(String(pick(p?.hiveContribution, 0)));
    setMinimumInvestmentAllowed(String(pick(p?.minimumInvestment, p?.minimumInvestmentAllowed, "")));
    setInvestorProfitSharePct(String(pick(p?.investorProfitShare, p?.investorProfitSharePct, "75")));
    setHiveProfitSharePct(String(pick(p?.hiveProfitShare, p?.hiveProfitSharePct, "25")));
    setConstructionStatus(String(p?.constructionStatus || "not-started"));
    setExpectedCompletionDurationMonths(
      String(pick(p?.expectedCompletionDuration, p?.expectedCompletionDurationMonths, "12"))
    );
    setExpectedSellingDurationMonths(
      String(pick(p?.expectedSellingDuration, p?.expectedSellingDurationMonths, p?.expectedSaleDurationMonths, "6"))
    );
    setInvestorProtectionEnabled(p?.investorProtectionEnabled === false ? "no" : "yes");
    setEarlyWithdrawalAllowed(p?.earlyWithdrawalAllowed === false ? "no" : "yes");
    setEarlyWithdrawalProfitRule(String(pick(p?.earlyWithdrawalProfit, p?.earlyWithdrawalProfitRule, "no-profit")));
    setListingStatus(normalizeListingStatus(pick(p?.listingStatus, "draft")));
    setFeaturedProperty(pick(p?.featured, p?.featuredProperty, false) ? "yes" : "no");
    setRiskLevel(String(pick(p?.riskLevel, "medium")));
    setBedrooms(String(p?.bedrooms ?? ""));
    setBathrooms(String(p?.bathrooms ?? ""));
    setAreaSize(String(p?.areaSize ?? ""));
    setGarage(String(p?.garage ?? ""));
    setFloorCount(String(p?.floorCount ?? ""));
    setNearbySchool(p?.nearbySchool ? "yes" : "no");
    setNearbyHospital(p?.nearbyHospital ? "yes" : "no");
    setNearbyMarket(p?.nearbyMarket ? "yes" : "no");
    setNearbyMosque(p?.nearbyMosque ? "yes" : "no");
    setThumbnailImage(null);
    setGalleryImages([]);
    setExistingMedia({
      thumbnail: p?.thumbnail?.url ? p.thumbnail : null,
      gallery: Array.isArray(p?.galleryImages) ? p.galleryImages.filter((img) => img?.url) : [],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const getStoredFundingFields = () => {
    if (!isEditMode || !editingId) {
      return {
        fundingCollected: 0,
        fundingProgressPct: 0,
        expectedAnnualRoiPct: 0,
      };
    }

    const existing = properties.find((p) => String(p.id) === String(editingId));
    return {
      fundingCollected: Number(existing?.fundingCollected) || 0,
      fundingProgressPct: Number(existing?.fundingProgressPct) || 0,
      expectedAnnualRoiPct: Number(existing?.expectedAnnualRoiPct) || 0,
    };
  };

  const handlePickThumbnail = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (picked.length === 0) return;
    setModalError("");
    setThumbnailImage(picked[0]);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handlePickGallery = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (picked.length === 0) return;
    if (picked.length > 4) {
      setModalError("Gallery allows up to 4 images.");
      return;
    }
    setModalError("");
    setGalleryImages(picked.slice(0, 4));
    if (galleryInputRef.current) galleryInputRef.current.value = "";
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
    const hive = Number(hiveContribution);
    const expectedSellingPrice = 0;
    const requiredFunding = Math.max(0, tc - hive);
    const expectedProfit = 0;
    const storedFunding = getStoredFundingFields();
    const minimumInvestment = Number(minimumInvestmentAllowed);
    const investorShare = Number(investorProfitSharePct);
    const hiveShare = Number(hiveProfitSharePct);
    const completionDuration = Number(expectedCompletionDurationMonths);
    const sellingDuration = Number(expectedSellingDurationMonths);
    const beds = Number(bedrooms);
    const baths = Number(bathrooms);
    const area = Number(areaSize);
    const garageCount = Number(garage);
    const floors = Number(floorCount);
    const constructionDerived = Math.max(0, tc - hive);
    const landDerived = Math.max(0, tc - constructionDerived);
    const derivedPublicStatus =
      listingStatus === "completed" ||
      constructionStatus === "sold" ||
      constructionStatus === "completed"
        ? "sold"
        : listingStatus === "active" &&
            ["under-construction", "gray-structure-completed", "finishing-work"].includes(
              constructionStatus
            )
          ? "in-progress"
          : "available";

    if (
      !Number.isFinite(tc) ||
      !Number.isFinite(hive) ||
      !Number.isFinite(requiredFunding) ||
      !Number.isFinite(minimumInvestment) ||
      !Number.isFinite(investorShare) ||
      !Number.isFinite(hiveShare) ||
      !Number.isFinite(completionDuration) ||
      !Number.isFinite(sellingDuration) ||
      !Number.isFinite(beds) ||
      !Number.isFinite(baths) ||
      !Number.isFinite(area) ||
      !Number.isFinite(garageCount) ||
      !Number.isFinite(floors)
    ) {
      setModalError("Please enter valid numbers for all numeric fields.");
      return;
    }

    if (minimumInvestment < 0) {
      setModalError("Minimum investment cannot be negative.");
      return;
    }

    if (Math.round(investorShare + hiveShare) !== 100) {
      setModalError("Investor and Hive profit shares must total 100.");
      return;
    }

    if (!thumbnailImage) {
      setModalError("Please upload a property thumbnail.");
      return;
    }
    if (galleryImages.length > 4) {
      setModalError("Gallery allows up to 4 images.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      appendPropertyFormFields(fd, {
        title: t,
        type: String(propertyType || "house"),
        city: loc,
        address: String(fullAddress || "").trim(),
        description: String(description || "").trim(),
        totalCost: tc,
        constructionStatus: String(constructionStatus || "not-started"),
        listingStatus: normalizeListingStatus(listingStatus),
        expectedSellingPrice,
        investorFundingRequired: requiredFunding,
        hiveContribution: hive,
        expectedProfitPercentage: expectedProfit,
        minimumInvestment,
        investorProfitShare: investorShare,
        hiveProfitShare: hiveShare,
        expectedCompletionDuration: completionDuration,
        expectedSellingDuration: sellingDuration,
        fundingCollected: storedFunding.fundingCollected,
        fundingProgressPct: storedFunding.fundingProgressPct,
        expectedAnnualRoiPct: storedFunding.expectedAnnualRoiPct,
        riskLevel: String(riskLevel || "medium"),
        bedrooms: beds,
        bathrooms: baths,
        areaSize: area,
        garage: garageCount,
        floorCount: floors,
        nearbySchool: nearbySchool === "yes",
        nearbyHospital: nearbyHospital === "yes",
        nearbyMarket: nearbyMarket === "yes",
        nearbyMosque: nearbyMosque === "yes",
        investorProtectionEnabled: investorProtectionEnabled === "yes",
        earlyWithdrawalAllowed: earlyWithdrawalAllowed === "yes",
        earlyWithdrawalProfit: String(earlyWithdrawalProfitRule || "no-profit"),
        featured: featuredProperty === "yes",
        createdBy: "admin",
      });
      fd.append("images", thumbnailImage);
      Array.from(galleryImages).forEach((file) => {
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
    const hive = Number(hiveContribution);
    const expectedSellingPrice = 0;
    const requiredFunding = Math.max(0, tc - hive);
    const expectedProfit = 0;
    const storedFunding = getStoredFundingFields();
    const minimumInvestment = Number(minimumInvestmentAllowed);
    const investorShare = Number(investorProfitSharePct);
    const hiveShare = Number(hiveProfitSharePct);
    const completionDuration = Number(expectedCompletionDurationMonths);
    const sellingDuration = Number(expectedSellingDurationMonths);
    const beds = Number(bedrooms);
    const baths = Number(bathrooms);
    const area = Number(areaSize);
    const garageCount = Number(garage);
    const floors = Number(floorCount);
    const constructionDerived = Math.max(0, tc - hive);
    const landDerived = Math.max(0, tc - constructionDerived);
    const derivedPublicStatus =
      listingStatus === "completed" ||
      constructionStatus === "sold" ||
      constructionStatus === "completed"
        ? "sold"
        : listingStatus === "active" &&
            ["under-construction", "gray-structure-completed", "finishing-work"].includes(
              constructionStatus
            )
          ? "in-progress"
          : "available";

    if (
      !Number.isFinite(tc) ||
      !Number.isFinite(hive) ||
      !Number.isFinite(requiredFunding) ||
      !Number.isFinite(minimumInvestment) ||
      !Number.isFinite(investorShare) ||
      !Number.isFinite(hiveShare) ||
      !Number.isFinite(completionDuration) ||
      !Number.isFinite(sellingDuration) ||
      !Number.isFinite(beds) ||
      !Number.isFinite(baths) ||
      !Number.isFinite(area) ||
      !Number.isFinite(garageCount) ||
      !Number.isFinite(floors)
    ) {
      setModalError("Please enter valid numbers for all numeric fields.");
      return;
    }

    if (minimumInvestment < 0) {
      setModalError("Minimum investment cannot be negative.");
      return;
    }

    if (Math.round(investorShare + hiveShare) !== 100) {
      setModalError("Investor and Hive profit shares must total 100.");
      return;
    }

    if (!thumbnailImage && !existingMedia.thumbnail?.url) {
      setModalError("Property must have a thumbnail.");
      return;
    }

    if (galleryImages.length > 4) {
      setModalError("Gallery allows up to 4 images.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      appendPropertyFormFields(fd, {
        title: t,
        type: String(propertyType || "house"),
        city: loc,
        address: String(fullAddress || "").trim(),
        description: String(description || "").trim(),
        totalCost: tc,
        constructionStatus: String(constructionStatus || "not-started"),
        listingStatus: normalizeListingStatus(listingStatus),
        expectedSellingPrice,
        investorFundingRequired: requiredFunding,
        hiveContribution: hive,
        expectedProfitPercentage: expectedProfit,
        minimumInvestment,
        investorProfitShare: investorShare,
        hiveProfitShare: hiveShare,
        expectedCompletionDuration: completionDuration,
        expectedSellingDuration: sellingDuration,
        fundingCollected: storedFunding.fundingCollected,
        fundingProgressPct: storedFunding.fundingProgressPct,
        expectedAnnualRoiPct: storedFunding.expectedAnnualRoiPct,
        riskLevel: String(riskLevel || "medium"),
        bedrooms: beds,
        bathrooms: baths,
        areaSize: area,
        garage: garageCount,
        floorCount: floors,
        nearbySchool: nearbySchool === "yes",
        nearbyHospital: nearbyHospital === "yes",
        nearbyMarket: nearbyMarket === "yes",
        nearbyMosque: nearbyMosque === "yes",
        investorProtectionEnabled: investorProtectionEnabled === "yes",
        earlyWithdrawalAllowed: earlyWithdrawalAllowed === "yes",
        earlyWithdrawalProfit: String(earlyWithdrawalProfitRule || "no-profit"),
        featured: featuredProperty === "yes",
        createdBy: "admin",
      });

      if (thumbnailImage) {
        fd.append("thumbnail", thumbnailImage);
      }
      galleryImages.forEach((file) => {
        fd.append("galleryImages", file);
      });

      const res = await fetch(`/api/admin/properties/${editingId}`, {
        method: "PUT",
        body: fd,
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
      const displayStatus = formatStatus(p.listingStatus);
      const matchesQuery = q
        ? `${p.title} ${p.city} ${p.id}`.toLowerCase().includes(q)
        : true;

      const matchesStatus = status === "All" ? true : displayStatus === status;

      return matchesQuery && matchesStatus;
    });
  }, [query, status, properties]);

  useEffect(() => {
    const tc = Number(totalCost);
    const hive = Number(hiveContribution);
    if (!Number.isFinite(tc) || !Number.isFinite(hive)) {
      setRequiredInvestorFunding("");
      return;
    }
    setRequiredInvestorFunding(String(Math.max(0, tc - hive)));
  }, [totalCost, hiveContribution]);

  const modalTabs = [
    { key: "basic", label: "Basic Info" },
    { key: "financial", label: "Financial" },
    { key: "construction", label: "Construction" },
    { key: "media", label: "Media" },
    { key: "rules", label: "Rules" },
  ];

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
            placeholder="Search by title, city, or id"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe"
          >
            <option value="All">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
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
                        {p?.thumbnail?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnail.url}
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
                            <span className="font-semibold text-hive-charcoal">
                              {(p?.thumbnail?.url ? 1 : 0) +
                                (Array.isArray(p?.galleryImages) ? p.galleryImages.length : 0)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm text-hive-slate">
                      {p.city}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <StatusBadge status={formatStatus(p.listingStatus)} />
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4 text-sm font-semibold text-hive-charcoal">
                      {formatCurrency(p.totalCost)}
                    </td>
                    <td className="border-t border-hive-taupe/20 px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(p)}
                          className="rounded-md border border-hive-taupe/40 px-3 py-2 text-xs font-semibold text-hive-charcoal transition-colors hover:border-hive-taupe hover:text-hive-taupe"
                        >
                          View
                        </button>
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
                    ? "Update property details. Upload a new thumbnail or gallery to replace existing Cloudinary images."
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
                <div className="mb-6 rounded-xl border border-hive-taupe/20 bg-hive-light p-2">
                  <div className="grid gap-2 sm:grid-cols-5">
                    {modalTabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setModalTab(tab.key)}
                        className={
                          "rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors " +
                          (modalTab === tab.key
                            ? "bg-hive-charcoal text-hive-light"
                            : "border border-hive-taupe/20 text-hive-slate hover:border-hive-taupe hover:text-hive-charcoal")
                        }
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

              <div className="space-y-6">
                {modalTab === "basic" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                    Basic Information
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Property Title *</label>
                      <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Property Type *</label>
                      <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe">
                        <option value="house">House</option>
                        <option value="apartment">Apartment</option>
                        <option value="plot">Plot</option>
                        <option value="commercial">Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">City / Location *</label>
                      <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Full Address</label>
                      <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm font-semibold text-hive-charcoal">Property Description *</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm text-hive-charcoal outline-none focus:border-hive-taupe" />
                    </div>
                  </div>
                </div>
                ) : null}

                {modalTab === "financial" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Financial Details</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div><label className="text-sm font-semibold text-hive-charcoal">Total Project Cost *</label><input value={totalCost} onChange={(e) => setTotalCost(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Hive Contribution Amount *</label><input value={hiveContribution} onChange={(e) => setHiveContribution(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Required Investor Funding *</label>
                      <input
                        value={requiredInvestorFunding}
                        readOnly
                        inputMode="numeric"
                        className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-zinc-50 px-3 py-2 text-sm text-hive-charcoal"
                      />
                      <p className="mt-1 text-xs text-hive-slate">
                        Auto-calculated as Total Project Cost minus Hive Contribution.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Minimum Investment Allowed</label>
                      <input
                        value={minimumInvestmentAllowed}
                        onChange={(e) => setMinimumInvestmentAllowed(e.target.value)}
                        inputMode="numeric"
                        placeholder="100000"
                        className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm"
                      />
                      <p className="mt-1 text-xs text-hive-slate">
                        Smallest amount an investor can contribute. Use 0 for no minimum.
                      </p>
                    </div>
                    <div className="sm:col-span-2 rounded-xl border border-hive-taupe/30 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-hive-charcoal">Profit distribution</p>
                      <p className="mt-2 text-sm text-hive-slate">
                        When the property generates profit,{" "}
                        <span className="font-semibold text-hive-charcoal">{investorProfitSharePct}%</span> goes to
                        investors and{" "}
                        <span className="font-semibold text-hive-charcoal">{hiveProfitSharePct}%</span> goes to Hive.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Risk Level</label>
                      <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
                ) : null}

                {modalTab === "financial" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Profit Distribution</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div><label className="text-sm font-semibold text-hive-charcoal">Investor Profit Share (%)</label><input value={investorProfitSharePct} onChange={(e) => setInvestorProfitSharePct(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Hive Profit Share (%)</label><input value={hiveProfitSharePct} onChange={(e) => setHiveProfitSharePct(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                  </div>
                </div>
                ) : null}

                {modalTab === "construction" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Construction Details</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Construction Status</label>
                      <select value={constructionStatus} onChange={(e) => setConstructionStatus(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm">
                        <option value="not-started">Not Started</option>
                        <option value="land-purchased">Land Purchased</option>
                        <option value="under-construction">Under Construction</option>
                        <option value="gray-structure-completed">Gray Structure Completed</option>
                        <option value="finishing-work">Finishing Work</option>
                        <option value="ready-for-sale">Ready for Sale</option>
                        <option value="sold">Sold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Expected Completion Duration</label>
                      <input value={expectedCompletionDurationMonths} onChange={(e) => setExpectedCompletionDurationMonths(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" placeholder="12" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Expected Selling Duration</label>
                      <input value={expectedSellingDurationMonths} onChange={(e) => setExpectedSellingDurationMonths(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" placeholder="6" />
                    </div>
                  </div>
                </div>
                ) : null}

                {modalTab === "basic" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Property Features</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div><label className="text-sm font-semibold text-hive-charcoal">Bedrooms</label><input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Bathrooms</label><input value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Area Size</label><input value={areaSize} onChange={(e) => setAreaSize(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" placeholder="e.g. 1200" /></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Garage</label><input value={garage} onChange={(e) => setGarage(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Floor Count</label><input value={floorCount} onChange={(e) => setFloorCount(e.target.value)} inputMode="numeric" className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm" /></div>
                  </div>
                </div>
                ) : null}

                {modalTab === "basic" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Nearby Facilities</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div><label className="text-sm font-semibold text-hive-charcoal">School</label><select value={nearbySchool} onChange={(e) => setNearbySchool(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm"><option value="no">No</option><option value="yes">Yes</option></select></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Hospital</label><select value={nearbyHospital} onChange={(e) => setNearbyHospital(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm"><option value="no">No</option><option value="yes">Yes</option></select></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Market</label><select value={nearbyMarket} onChange={(e) => setNearbyMarket(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm"><option value="no">No</option><option value="yes">Yes</option></select></div>
                    <div><label className="text-sm font-semibold text-hive-charcoal">Mosque</label><select value={nearbyMosque} onChange={(e) => setNearbyMosque(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm"><option value="no">No</option><option value="yes">Yes</option></select></div>
                  </div>
                </div>
                ) : null}

                {modalTab === "rules" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Exit & Security Rules</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Investor Protection Enabled</label>
                      <select value={investorProtectionEnabled} onChange={(e) => setInvestorProtectionEnabled(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm">
                        <option value="yes">Yes</option><option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Early Withdrawal Allowed</label>
                      <select value={earlyWithdrawalAllowed} onChange={(e) => setEarlyWithdrawalAllowed(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm">
                        <option value="yes">Yes</option><option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Early Withdrawal Profit</label>
                      <select value={earlyWithdrawalProfitRule} onChange={(e) => setEarlyWithdrawalProfitRule(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm">
                        <option value="no-profit">No Profit</option>
                        <option value="partial-profit">Partial Profit</option>
                        <option value="full-profit">Full Profit</option>
                      </select>
                    </div>
                  </div>
                </div>
                ) : null}

                {modalTab === "construction" ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Property Status</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Listing Status</label>
                      <select value={listingStatus} onChange={(e) => setListingStatus(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-hive-charcoal">Featured Property</label>
                      <select value={featuredProperty} onChange={(e) => setFeaturedProperty(e.target.value)} className="mt-2 w-full rounded-md border border-hive-taupe/20 bg-hive-light px-3 py-2 text-sm">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
                ) : null}

                {modalTab === "media" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
                      Property Media
                    </p>
                    <p className="mt-1 text-xs text-hive-slate">
                      {isEditMode
                        ? "Current images are shown below. Pick new files only for images you want to replace."
                        : "Upload one thumbnail and up to 4 gallery images."}
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-hive-taupe/25 p-4">
                        <label className="text-sm font-semibold text-hive-charcoal">
                          {isEditMode ? "Replace Thumbnail" : "Upload Property Thumbnail"}
                        </label>
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/*"
                          className="mt-2 w-full text-sm"
                          onChange={(e) => handlePickThumbnail(e.target.files)}
                        />
                      </div>
                      <div className="rounded-2xl border border-hive-taupe/25 p-4">
                        <label className="text-sm font-semibold text-hive-charcoal">
                          {isEditMode ? "Replace Gallery Images" : "Upload Gallery Images"}
                        </label>
                        <input
                          ref={galleryInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="mt-2 w-full text-sm"
                          onChange={(e) => handlePickGallery(e.target.files)}
                        />
                      </div>
                    </div>
                    {mediaPreviews.length > 0 ? (
                      <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="Property image previews">
                        {mediaPreviews.map((entry, idx) => (
                          <li
                            key={`${entry.label}-${idx}`}
                            className="relative aspect-square overflow-hidden rounded-xl border border-hive-taupe/25 bg-neutral-100 shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={entry.url}
                              alt={entry.label ? `Preview ${entry.label}` : `Preview ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <p className="pointer-events-none absolute bottom-0 left-0 right-0 truncate bg-black/55 px-1.5 py-1 text-[10px] text-white">
                              {entry.label}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
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

      {showViewModal ? (
        <AdminPropertyViewModal
          property={viewProperty}
          loading={viewLoading}
          error={viewError}
          onClose={closeViewModal}
          onEdit={editFromView}
        />
      ) : null}
    </>
  );
}
