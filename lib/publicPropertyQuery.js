/** Properties visible on the public website (visitor/investor browse). */
export const PUBLIC_ACTIVE_FILTER = { listingStatus: "active" };

/**
 * @param {import("next").NextApiRequest["query"]} query
 */
export function buildPublicPropertyQuery(query) {
  const filter = { ...PUBLIC_ACTIVE_FILTER };

  const featured = String(query?.featured ?? "")
    .trim()
    .toLowerCase();
  if (featured === "true" || featured === "1" || featured === "yes") {
    filter.featured = true;
  }

  return filter;
}
