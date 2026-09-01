import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getUserInitials } from "@/lib/userInitials";

const AVATAR_GRADIENTS = [
  "from-amber-400 via-orange-500 to-rose-500",
  "from-violet-400 via-purple-500 to-fuchsia-600",
  "from-sky-400 via-blue-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-rose-400 via-pink-500 to-red-500",
  "from-lime-400 via-green-500 to-emerald-600",
];

/** Avatars shown in the first row before "Show more". */
const ROW_CAPACITY = 6;

function hashSeed(value) {
  const seed = String(value || "");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function avatarGradient(seed) {
  return AVATAR_GRADIENTS[hashSeed(seed) % AVATAR_GRADIENTS.length];
}

function formatPlainCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "PKR —";
  return `PKR ${n.toLocaleString()}`;
}

function formatInvestmentDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSharePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function InvestorDetailCard({ investor }) {
  const initials = getUserInitials({ fullName: investor.investorName });
  const gradient = avatarGradient(investor.id || investor.investorId || investor.investorName);

  return (
    <div className="w-64 overflow-hidden rounded-2xl border border-hive-taupe/15 bg-white shadow-2xl">
      <div className={`bg-gradient-to-br ${gradient} px-4 py-4`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/20 text-sm font-bold text-white backdrop-blur-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">{investor.investorName || "Investor"}</p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Active investor</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-hive-slate">Invested</span>
          <span className="font-bold tabular-nums text-hive-charcoal">{formatPlainCurrency(investor.amount)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-hive-slate">Pool share</span>
          <span className="font-bold tabular-nums text-hive-charcoal">
            {formatSharePct(investor.sharePercentage)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-hive-slate">Since</span>
          <span className="font-semibold text-hive-charcoal">{formatInvestmentDate(investor.investmentDate)}</span>
        </div>
      </div>
    </div>
  );
}

function InvestorHoverPopover({ investor, anchorRef, open, onOpenChange }) {
  const popoverRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState({ top: 0, left: 0, placement: "bottom" });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const popoverHeight = popoverRef.current?.offsetHeight || 220;
    const popoverWidth = 256;
    const gap = 10;
    const viewportPadding = 12;

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const placement = spaceBelow >= popoverHeight || spaceBelow >= spaceAbove ? "bottom" : "top";

    let top =
      placement === "bottom" ? rect.bottom + gap : rect.top - popoverHeight - gap;
    let left = rect.left + rect.width / 2;

    left = Math.max(viewportPadding + popoverWidth / 2, left);
    left = Math.min(window.innerWidth - viewportPadding - popoverWidth / 2, left);
    top = Math.max(viewportPadding, Math.min(window.innerHeight - popoverHeight - viewportPadding, top));

    setStyle({ top, left, placement });
  }, [anchorRef]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      const target = event.target;
      if (
        anchorRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      onOpenChange(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, anchorRef, onOpenChange]);

  if (!mounted || !open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      role="tooltip"
      className="fixed z-[9999] -translate-x-1/2 transition-opacity duration-150"
      style={{ top: style.top, left: style.left }}
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      {style.placement === "bottom" ? (
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-hive-taupe/15 bg-white" />
      ) : (
        <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-hive-taupe/15 bg-white" />
      )}
      <InvestorDetailCard investor={investor} />
    </div>,
    document.body
  );
}

export function InvestorProfileBubble({ investor }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const initials = getUserInitials({ fullName: investor.investorName });
  const gradient = avatarGradient(investor.id || investor.investorId || investor.investorName);
  const firstName = investor.investorName?.split(/\s+/)[0] || "Investor";

  return (
    <>
      <div ref={anchorRef} className="relative shrink-0">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`View ${investor.investorName || "investor"} details`}
          onClick={() => setOpen((prev) => !prev)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
          className="group flex w-[5.5rem] flex-col items-center gap-2 outline-none"
        >
          <div
            className={`rounded-full bg-gradient-to-tr ${gradient} p-[3px] shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg group-focus-visible:scale-105`}
          >
            <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-hive-charcoal text-base font-bold text-hive-light ring-2 ring-white">
              {initials}
            </div>
          </div>
          <span className="max-w-full truncate text-center text-xs font-semibold text-hive-charcoal">
            {firstName}
          </span>
        </button>
      </div>

      <InvestorHoverPopover
        investor={investor}
        anchorRef={anchorRef}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function InvestorAvatarStack({ investors, max = 5 }) {
  const visible = investors.slice(0, max);
  const overflow = Math.max(0, investors.length - max);

  if (visible.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2.5">
        {visible.map((investor, idx) => {
          const initials = getUserInitials({ fullName: investor.investorName });
          const gradient = avatarGradient(investor.id || investor.investorId || investor.investorName);
          return (
            <div
              key={investor.id}
              title={investor.investorName}
              className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr ${gradient} p-[2px] ring-2 ring-hive-charcoal`}
              style={{ zIndex: max - idx }}
            >
              <span className="flex h-full w-full items-center justify-center rounded-full bg-hive-charcoal text-[10px] font-bold text-hive-light">
                {initials}
              </span>
            </div>
          );
        })}
        {overflow > 0 ? (
          <div
            className="relative z-0 flex h-9 w-9 items-center justify-center rounded-full bg-hive-slate/80 text-[10px] font-bold text-hive-light ring-2 ring-hive-charcoal"
            title={`${overflow} more investor${overflow === 1 ? "" : "s"}`}
          >
            +{overflow}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PropertyInvestorsSection({ investors = [], investorCount = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = investors.length > ROW_CAPACITY;
  const hiddenCount = Math.max(0, investors.length - ROW_CAPACITY);

  if (investors.length === 0) {
    return (
      <div className="rounded-3xl border border-hive-taupe/20 bg-gradient-to-br from-hive-light via-white to-hive-taupe/5 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Community</p>
            <h2 className="mt-1 text-lg font-semibold text-hive-charcoal">Property Investors</h2>
          </div>
          <span className="rounded-full bg-hive-taupe/15 px-3 py-1 text-xs font-semibold text-hive-charcoal">
            0 active
          </span>
        </div>
        <div className="mt-6 rounded-2xl border border-dashed border-hive-taupe/30 bg-white/60 p-8 text-center">
          <p className="text-sm font-semibold text-hive-charcoal">No active investors yet</p>
          <p className="mt-1 text-xs text-hive-slate">Be the first to invest in this property.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-hive-taupe/20 bg-gradient-to-br from-hive-light via-white to-hive-taupe/5 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Community</p>
          <h2 className="mt-1 text-lg font-semibold text-hive-charcoal">Property Investors</h2>
          <p className="mt-1 max-w-md text-xs text-hive-slate/80">
            Hover a profile to view investment details. Exited investors are not shown.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-hive-taupe/15 bg-white/80 px-4 py-2.5 shadow-sm">
          <InvestorAvatarStack investors={investors} max={4} />
          <div>
            <p className="text-sm font-bold tabular-nums text-hive-charcoal">{investorCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-hive-slate">Active</p>
          </div>
        </div>
      </div>

      <div className={expanded ? "mt-6 max-h-52 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]" : "mt-6"}>
        <div
          className={
            expanded
              ? "grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
              : "flex flex-nowrap items-start gap-x-6 overflow-hidden"
          }
        >
          {(expanded ? investors : investors.slice(0, ROW_CAPACITY)).map((investor) => (
            <InvestorProfileBubble key={investor.id} investor={investor} />
          ))}
        </div>
      </div>

      {hasOverflow ? (
        <div className="mt-5 flex justify-center border-t border-hive-taupe/10 pt-4">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-full border border-hive-charcoal/20 bg-white px-5 py-2 text-xs font-semibold text-hive-charcoal shadow-sm transition-colors hover:border-hive-taupe hover:text-hive-taupe"
          >
            {expanded ? "Show less" : `Show ${hiddenCount} more investor${hiddenCount === 1 ? "" : "s"}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
