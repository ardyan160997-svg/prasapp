import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "novia adriyani",
  description: "Aplikasi pertanyaan pdkt buat kamu 💕",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon-16x16.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${nunito.variable} ${quicksand.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}