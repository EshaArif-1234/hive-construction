export default function StatusBadge({ status }) {
  const statusText = status ?? "Available";

  const classes =
    statusText === "Available"
      ? "bg-hive-taupe text-hive-charcoal"
      : statusText === "In Progress"
        ? "bg-hive-charcoal text-hive-taupe border border-hive-taupe/40"
        : "bg-hive-slate text-hive-light";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {statusText}
    </span>
  );
}
