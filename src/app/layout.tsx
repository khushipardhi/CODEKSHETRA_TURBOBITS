import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/components/auth-provider";

// High-performance system typography fallbacks (zero network latency)
const inter = { variable: "font-sans" };
const jakarta = { variable: "font-sans" };

import { BRANDING } from "@/config/branding";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: `${BRANDING.name} — ${BRANDING.tagline}`,
    template: `%s | ${BRANDING.compactName}`,
  },
  description: BRANDING.description,
  keywords: ["Sentinel", "City Intelligence", "urban", "hazard", "simulation", "telemetry", "emergency", "Mumbai", "Pune", "Nagpur"],
  authors: [{ name: BRANDING.name }],
  icons: {
    icon: [
      { url: BRANDING.assets.favicon, type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: BRANDING.assets.favicon,
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: BRANDING.name,
    description: BRANDING.description,
    type: "website",
    images: [{ url: BRANDING.assets.logo }],
  },
};

const themeScript = `(function(){try{var stored=localStorage.getItem('nagpur-theme')||localStorage.getItem('urban-link-theme');var theme=stored||'light';document.documentElement.setAttribute('data-theme',theme);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

