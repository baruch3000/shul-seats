"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push("/admin");
    } else {
      setError(data.error || "שגיאה");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md pt-12 animate-fade-in">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-[#7b1e3a]">כניסת גבאי</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="אימייל"
            className="w-full rounded-lg border px-4 py-3 focus:border-[#7b1e3a] focus:outline-none"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            className="w-full rounded-lg border px-4 py-3 focus:border-[#7b1e3a] focus:outline-none"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#7b1e3a] py-3 font-medium text-white hover:bg-[#5c1529] disabled:opacity-50"
          >
            {loading ? "נכנס..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}
