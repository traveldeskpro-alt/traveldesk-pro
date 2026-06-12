import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "TravelDesk Pro - Smart. Simple. Powerful.",
  description: "SaaS platform for travel agencies to manage bookings, invoices, agents, and commissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-[#F8FAFC]">
        <AuthProvider>
          <LanguageProvider>
            <DarkModeProvider>
              <AppShell>{children}</AppShell>
            </DarkModeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
