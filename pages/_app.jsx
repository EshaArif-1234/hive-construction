import "../app/globals.css";
import WebsiteLayout from "@/layouts/website-layout";
import AdminLayout from "@/layouts/admin-layout";
import InvestorLayout from "@/layouts/investor-layout";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith("/admin");
  const isInvestorRoute = router.pathname.startsWith("/investor");
  const isAdminAuthRoute = router.pathname === "/admin/login";

  const Wrapped = isAdminRoute
    ? isAdminAuthRoute
      ? WebsiteLayout
      : AdminLayout
    : isInvestorRoute
      ? InvestorLayout
      : WebsiteLayout;

  return (
    <Wrapped>
      <Component {...pageProps} />
    </Wrapped>
  );
}
