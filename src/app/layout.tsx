import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#09090b",
};
import { Outfit, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { FeedbackModal } from '@/components/layout/FeedbackModal';
import { Toaster } from '@/components/ui/Toast';
import { ThemeSync } from "@/components/layout/ThemeSync";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevTools Pro | Developer Utilities Platform",
  description: "20+ production-grade developer utilities in one beautiful platform. JSON beautifier, Base64 encoder, JWT decoder, hash generator, and more.",
  keywords: ["developer tools", "json beautifier", "base64 encoder", "jwt decoder", "hash generator", "regex tester", "devtools"],
  authors: [{ name: "DevTools Pro" }],
  manifest: "/manifest.json",
  appleWebApp: {
    title: "DevTools Pro",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "DevTools Pro | Developer Utilities Platform",
    description: "20+ production-grade developer utilities in one beautiful platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${outfit.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased`}>
        <ThemeSync />
        <Header />
        {children}
        <Footer />
        <CommandPalette />
        <FeedbackModal />
        <Toaster />
      </body>
    </html>
  );
}