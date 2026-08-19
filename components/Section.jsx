export default function Section({ id, eyebrow, title, description, children }) {
  return (
    <section id={id} className="py-10 sm:py-12">
      {(eyebrow || title || description) && (
        <div className="mb-10 max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal sm:text-3xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-3 text-base leading-7 text-hive-slate">
              {description}
            </p>
          ) : null}
        </div>
      )}

      {children}
    </section>
  );
}
