import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrasFinance",
  description: "Aplikasi pencatat keuangan keluarga untuk pemasukan, pengeluaran, tabungan, dan rencana masa depan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">{children}</body>
    </html>
  );
}
