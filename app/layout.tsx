import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});
const jakarta = localFont({
  src: "../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-display",
  display: "swap",
});
const mono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://project-supervision-system.vercel.app"),
  openGraph: { images: ["/yabatech-og-preview.png"], locale: "en_NG", type: "website" },
  twitter: { card: "summary_large_image", images: ["/yabatech-og-preview.png"] },
  title: {
    default: "YABATECH Project Supervision",
    template: "%s · YABATECH Project Supervision",
  },
  description:
    "Students, supervisors and the HOD in one calm workspace for final-year projects at Yaba College of Technology.",
};

export const viewport: Viewport = {
  themeColor: "#08361A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} ${mono.variable} grain font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster closeButton position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
