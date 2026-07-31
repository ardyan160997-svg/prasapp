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
  title: "Prastation | Creative Station untuk Studio, Event & Komunitas",
  description: "Prastation adalah creative station lengkap untuk booking studio recording, photo studio, rental equipment, event space, dan jasa produksi video/foto. Bergabung dengan komunitas kreator Indonesia.",
  keywords: ["prastation", "studio recording", "photo studio", "rental equipment", "event space", "booking studio", "creative community", "produksi video", "produksi foto"],
  authors: [{ name: "Prastation" }],
  creator: "Prastation",
  publisher: "Prastation",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://prastation.com",
    title: "Prastation | Creative Station untuk Studio, Event & Komunitas",
    description: "Booking studio, rental equipment, event space, dan jasa produksi profesional. Bergabung dengan komunitas kreator Indonesia.",
    siteName: "Prastation",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prastation | Creative Station",
    description: "Booking studio, rental equipment, event space, dan jasa produksi profesional.",
  },
  metadataBase: new URL("https://prastation.com"),
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