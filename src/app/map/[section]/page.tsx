"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LegacyMapRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    router.replace("/map");
  }, [router, params.section]);

  return <div className="py-12 text-center text-[#8B4557]">מעביר למפה המלאה...</div>;
}
