import "../app/globals.css";
import WebsiteLayout from "@/layouts/website-layout";

export default function App({ Component, pageProps }) {
  return (
    <WebsiteLayout>
      <Component {...pageProps} />
    </WebsiteLayout>
  );
}
