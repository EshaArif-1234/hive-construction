import { useRouter } from "next/router";
import { useEffect } from "react";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?role=admin");
  }, [router]);

  return null;
}
