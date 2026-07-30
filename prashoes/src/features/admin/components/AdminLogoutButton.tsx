"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/admin/logout", {
        method: "POST",
      });

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex w-fit rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Keluar..." : "Logout"}
    </button>
  );
}
