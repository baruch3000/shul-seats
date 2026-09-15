"use client";

import { useEffect, useState } from "react";

export function AdminControls() {
  const [bookingOpen, setBookingOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setBookingOpen(d.bookingOpen ?? true);
        setLoading(false);
      });
  }, []);

  const toggle = async () => {
    const newValue = !bookingOpen;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingOpen: newValue }),
    });
    setBookingOpen(newValue);
  };

  if (loading) return null;

  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow">
      <span className="font-medium">
        בחירת מקומות: {bookingOpen ? "פתוחה ✅" : "סגורה 🔒"}
      </span>
      <button
        onClick={toggle}
        className={`rounded-lg px-4 py-2 text-sm text-white ${
          bookingOpen ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {bookingOpen ? "סגור לבחירה" : "פתח לבחירה"}
      </button>
    </div>
  );
}
