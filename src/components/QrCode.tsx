"use client";

import { useEffect, useState } from "react";

export function QrCode() {
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="mx-auto max-w-xs rounded-xl bg-white p-4 shadow">
      <p className="mb-2 text-sm text-[#8d6e63]">סרקו לכניסה מהירה מהטלפון:</p>
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(origin)}`}
        alt="QR Code"
        className="mx-auto"
        width={150}
        height={150}
      />
    </div>
  );
}
