import Header from "@/components/header";

export default function WebsiteLayout({ children }) {
  return (
    <div className="min-h-dvh bg-hive-light text-hive-slate">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
