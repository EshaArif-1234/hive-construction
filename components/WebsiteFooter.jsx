import Link from "next/link";

export default function WebsiteFooter() {
  return (
    <footer className="border-t border-hive-taupe/20 bg-hive-light">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-base font-semibold text-hive-charcoal">
              Hive Construction Ventures Advisor System
            </p>
            <p className="mt-2 text-sm leading-6 text-hive-slate">
              Trust-first construction investment advisory platform.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-hive-charcoal">Navigation</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link className="text-hive-slate hover:text-hive-taupe" href="/">
                Home
              </Link>
              <Link
                className="text-hive-slate hover:text-hive-taupe"
                href="/about-us"
              >
                About
              </Link>
              <Link
                className="text-hive-slate hover:text-hive-taupe"
                href="/privacy-policy"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-hive-charcoal">Contact</p>
            <div className="mt-3 text-sm text-hive-slate">
              <p>Email: contact@hiveconstruction.example</p>
              <p className="mt-1">Phone: +00 000 000 000</p>
              <p className="mt-1">Location: (Add office address)</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-hive-taupe/20 pt-6">
          <p className="text-xs text-hive-slate">
            © {new Date().getFullYear()} Hive Construction Ventures. All rights reserved.
          </p>
          <div className="text-xs text-hive-slate">
            Built for transparency • Designed for trust
          </div>
        </div>
      </div>
    </footer>
  );
}
