import Header from "@/components/header";

export default function WebsiteLayout({ children }) {
  return (
    <div className="min-h-dvh bg-hive-light text-hive-slate">
      <Header />
      <main className="container mx-auto px-4 pt-8 sm:pt-10 md:pt-16">{children}</main>
    </div>
  );
}
