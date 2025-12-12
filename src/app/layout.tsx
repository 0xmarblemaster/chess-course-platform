import type { Metadata } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
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
        className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} antialiased`}
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
