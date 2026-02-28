import Link from "next/link";

const navItems = [
  { label: "Our Properties", href: "/properties" },
  { label: "About Us", href: "/about-us" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-hive-taupe bg-hive-charcoal">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">

          {/* <div className="flex h-11 w-11 items-center justify-center rounded-md bg-hive-light">
            <Image
              src="/images/hive-logo.png"
              alt="Hive Construction logo"
              width={32}
              height={32}
              priority
            />
          </div> */}

          <span className="text-lg font-semibold tracking-tight text-hive-light">
            Hive Construction
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-hive-light/90 transition-colors hover:text-hive-taupe"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-md border border-hive-taupe px-4 py-2 text-sm font-semibold text-hive-light transition-colors hover:bg-hive-taupe hover:text-hive-charcoal"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-hive-taupe px-4 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
          >
            Sign Up
          </Link>
        </div>

        <div className="flex items-center md:hidden">
          <Link
            href="/login"
            className="rounded-md bg-hive-taupe px-3 py-2 text-sm font-semibold text-hive-charcoal transition-colors hover:bg-hive-light"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}