export function buildPropertyInvestReturnUrl(propertyId) {
  const id = String(propertyId || "").trim();
  if (!id) return null;
  return `/properties/${encodeURIComponent(id)}?invest=1`;
}

export function buildInvestorLoginRoute(propertyId) {
  const next = buildPropertyInvestReturnUrl(propertyId);
  if (!next) {
    return { pathname: "/login", query: { role: "investor" } };
  }
  return { pathname: "/login", query: { role: "investor", next } };
}

export function buildInvestorSignupRoute(propertyId) {
  const next = buildPropertyInvestReturnUrl(propertyId);
  if (!next) {
    return { pathname: "/signup" };
  }
  return { pathname: "/signup", query: { next } };
}

export function isInvestReturnUrl(url) {
  if (typeof url !== "string" || !url.startsWith("/")) return false;
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return false;
  const path = url.slice(0, queryIndex);
  if (!path.startsWith("/properties/")) return false;
  const params = new URLSearchParams(url.slice(queryIndex + 1));
  return params.get("invest") === "1";
}
