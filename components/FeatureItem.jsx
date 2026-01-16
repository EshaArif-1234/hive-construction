export default function FeatureItem({ title, description, icon }) {
  return (
    <div className="rounded-2xl border border-hive-taupe/20 bg-hive-light p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-hive-charcoal text-hive-light">
          <span className="text-lg font-semibold text-hive-taupe" aria-hidden>
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-hive-charcoal">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-hive-slate">{description}</p>
        </div>
      </div>
    </div>
  );
}
