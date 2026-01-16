export default function StepItem({ step, title, description }) {
  return (
    <div className="relative rounded-2xl border border-hive-taupe/20 bg-hive-light p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hive-charcoal text-sm font-semibold text-hive-taupe">
          {step}
        </div>
        <div>
          <h3 className="text-base font-semibold text-hive-charcoal">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-hive-slate">{description}</p>
        </div>
      </div>
    </div>
  );
}
