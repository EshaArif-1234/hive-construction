import Link from "next/link";

export default function AdminReportShell({
  title,
  description,
  breadcrumbs = [],
  exportLabel,
  onExport,
  children,
}) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-hive-slate">
        <Link href="/admin/reports" className="font-semibold text-hive-taupe hover:text-hive-charcoal">
          Reports
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href || crumb.label} className="inline-flex items-center gap-2">
            <span>/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="font-semibold hover:text-hive-charcoal">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-hive-charcoal">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="rounded-3xl border border-hive-taupe/20 bg-hive-light p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">Reporting</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-hive-charcoal">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-hive-slate">{description}</p>
            ) : null}
          </div>
          {onExport ? (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center justify-center rounded-md bg-hive-charcoal px-5 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:text-hive-taupe"
            >
              {exportLabel || "Export CSV"}
            </button>
          ) : null}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
