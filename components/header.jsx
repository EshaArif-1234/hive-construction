import Link from "next/link";
import HeaderAuthMenu from "@/components/HeaderAuthMenu";

const navItems = [
  { label: "Our Properties", href: "/properties" },
  { label: "About Us", href: "/about-us" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-hive-taupe bg-hive-charcoal">
      <div className="container mx-auto flex w-full items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
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

        <HeaderAuthMenu />
      </div>
    </header>
  );
}
