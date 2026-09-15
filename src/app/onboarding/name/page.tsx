"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function NameOnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    const displayName =
      session?.user?.displayName?.trim() || session?.user?.name?.trim();
    if (displayName) {
      router.push("/map");
    } else if (session?.user?.name?.trim() && !name) {
      setName(session.user.name.trim());
    }
  }, [session, router, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });

      if (res.ok) {
        await update({ displayName: name.trim() });
        const callback = sessionStorage.getItem("postNameRedirect") || "/map";
        sessionStorage.removeItem("postNameRedirect");
        router.push(callback);
      } else {
        const data = await res.json();
        setError(data.error || "שגיאה");
      }
    } catch {
      setError("שגיאת רשת — נסה שוב");
    }
    setLoading(false);
  };

  if (status === "loading") return null;

  return (
    <div className="mx-auto max-w-md animate-fade-in pt-12">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-[#8B4557]">ברוכים הבאים!</h1>
        <p className="mb-6 text-[#5D4037]">איך לקרוא לך? השם יוצג בבחירת המקומות.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="השם שלך"
            className="w-full rounded-lg border border-[#E8D5C4] px-4 py-3 text-lg focus:border-[#8B4557] focus:outline-none"
            autoFocus
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full rounded-lg bg-[#8B4557] py-3 font-medium text-white hover:bg-[#6D3444] disabled:opacity-50"
          >
            {loading ? "שומר..." : "המשך לבחירת מקום"}
          </button>
        </form>
      </div>
    </div>
  );
}
