import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prashoes | Premium Shoe Care",
  description:
    "Prashoes adalah layanan cuci sepatu profesional dengan layanan antar jemput, tracking pesanan, dan perawatan premium.",
  icons: {
    icon: "/images/icon.avif",
    shortcut: "/images/icon.avif",
    apple: "/images/icon.avif",
  },
  keywords: [
    "cuci sepatu premium",
    "laundry sepatu",
    "perawatan sepatu",
    "deep clean sepatu",
    "antar jemput sepatu",
    "lacak pesanan sepatu",
    "Prashoes",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
