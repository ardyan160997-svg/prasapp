import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PraStation | Rental PlayStation Management",
  description:
    "PraStation membantu operasional rental PlayStation: billing bermain di tempat, rental bawa pulang, member QR, dan laporan harian.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
