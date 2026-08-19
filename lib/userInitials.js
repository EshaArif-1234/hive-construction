export function getUserInitials({ fullName, email } = {}) {
  const name = String(fullName || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }
  }

  const mail = String(email || "").trim().toLowerCase();
  if (mail) {
    const local = mail.split("@")[0] || "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    if (local.length === 1) return local.toUpperCase();
  }

  return "?";
}
