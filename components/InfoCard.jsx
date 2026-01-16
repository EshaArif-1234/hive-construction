export default function InfoCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-5">
      <p className="text-xs font-semibold text-hive-charcoal">{label}</p>
      <p className="mt-2 text-sm font-semibold text-hive-charcoal">{value}</p>
      {subtext ? (
        <p className="mt-2 text-sm leading-6 text-hive-slate">{subtext}</p>
      ) : null}
    </div>
  );
}
