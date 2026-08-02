import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prastation | Rental PlayStation 5 & PS4 Jakarta",
  description: "Sewa PlayStation 5, PS4, PS VR2, controller, dan game lengkap. Harga terjangkau mulai Rp100.000/hari. Antar-ambil gratis area Jakarta. Cocok mabar, liburan, keluarga.",
  keywords: ["rental playstation", "sewa ps5", "sewa ps4", "rental ps5 jakarta", "sewa playstation jakarta", "sewa konsol game", "mabar ps5", "paket sewa ps5"],
  authors: [{ name: "Prastation" }],
  creator: "Prastation",
  publisher: "Prastation",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://prastation.prasapp.com",
    title: "Prastation | Rental PlayStation 5 & PS4 Jakarta",
    description: "Sewa PS5, PS4, controller, game lengkap. Harga mulai Rp100.000/hari. Antar-ambil gratis Jakarta. Order via WhatsApp.",
    siteName: "Prastation",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prastation | Rental PlayStation Jakarta",
    description: "Sewa PS5, PS4, game lengkap. Harga terjangkau, antar-ambil gratis area Jakarta.",
  },
  metadataBase: new URL("https://prastation.prasapp.com"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-white font-sans">
        {children}
      </body>
    </html>
  );
}