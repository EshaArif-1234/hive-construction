import Link from "next/link";

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "Our Properties", href: "/properties" },
  { label: "About Us", href: "/about-us" },
];

const legalLinks = [
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

const trustPoints = [
  "75% / 25% profit split",
  "Cheque guarantee",
  "Real-time tracking",
];

function FooterLink({ href, children }) {
  return (
    <Link
      href={href}
      className="text-sm text-hive-light/75 transition-colors hover:text-hive-taupe"
    >
      {children}
    </Link>
  );
}

function FooterColumnTitle({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-hive-taupe">
      {children}
    </p>
  );
}

export default function WebsiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative left-1/2 mt-8 w-screen max-w-[100vw] -translate-x-1/2 border-t border-hive-taupe/30 bg-hive-charcoal text-hive-light">
      <div className="border-b border-hive-taupe/10 bg-hive-taupe/[0.06]">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3 text-center">
          {trustPoints.map((point) => (
            <span
              key={point}
              className="inline-flex items-center gap-2 text-xs font-medium text-hive-light/80 sm:text-sm"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-hive-taupe" aria-hidden />
              {point}
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-hive-taupe/40 bg-hive-taupe/10 text-sm font-bold text-hive-taupe">
                H
              </span>
              <span className="text-lg font-semibold tracking-tight text-hive-light">
                Hive Construction
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-hive-light/70">
              Trust-first construction investment advisory platform. Secured participation,
              transparent profit sharing, and professional documentation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/properties"
                className="inline-flex items-center justify-center rounded-md bg-hive-taupe px-4 py-2.5 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
              >
                View Properties
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md border border-hive-taupe/50 px-4 py-2.5 text-sm font-semibold text-hive-light transition-colors hover:border-hive-taupe hover:text-hive-taupe"
              >
                Become an Investor
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterColumnTitle>Explore</FooterColumnTitle>
            <nav className="mt-4 flex flex-col gap-3">
              {exploreLinks.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {item.label}
                </FooterLink>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-2">
            <FooterColumnTitle>Legal</FooterColumnTitle>
            <nav className="mt-4 flex flex-col gap-3">
              {legalLinks.map((item) => (
                <FooterLink key={item.href} href={item.href}>
                  {item.label}
                </FooterLink>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <FooterColumnTitle>Contact</FooterColumnTitle>
            <ul className="mt-4 space-y-4 text-sm">
              <li>
                <p className="text-xs font-medium uppercase tracking-wide text-hive-light/45">
                  Email
                </p>
                <a
                  href="mailto:contact@hiveconstruction.example"
                  className="mt-1 inline-block text-hive-light/80 transition-colors hover:text-hive-taupe"
                >
                  contact@hiveconstruction.example
                </a>
              </li>
              <li>
                <p className="text-xs font-medium uppercase tracking-wide text-hive-light/45">
                  Phone
                </p>
                <a
                  href="tel:+00000000000"
                  className="mt-1 inline-block text-hive-light/80 transition-colors hover:text-hive-taupe"
                >
                  +00 000 000 000
                </a>
              </li>
              <li>
                <p className="text-xs font-medium uppercase tracking-wide text-hive-light/45">
                  Office
                </p>
                <p className="mt-1 leading-6 text-hive-light/80">(Add office address)</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-hive-taupe/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-hive-light/50">
            © {year} Hive Construction Ventures. All rights reserved.
          </p>
          <p className="text-xs text-hive-light/50">
            Built for transparency · Designed for trust
          </p>
        </div>
      </div>
    </footer>
  );
}
