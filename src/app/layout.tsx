import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded, Cormorant_Garamond, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ClientOnly from "@/components/ClientOnly";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
});

// Chess (Classic) landing fonts. Mapped to the --font-display/--font-body/--font-mono
// tokens consumed by landing-chess.css.
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Chess Empire Platform",
  description: "Learn chess with interactive lessons and challenges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/clear-sans-webfont@1.0.1/css/clear-sans.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} ${cormorantGaramond.variable} ${ibmPlexSans.variable} ${jetBrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientOnly fallback={<div>Loading...</div>}>
          <LanguageProvider>
            <AuthProvider>
              <Navigation />
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
