import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteTitle = "YABATECH Project Supervision System";
const siteDescription =
  "A YABATECH HND workspace for students, supervisors and the HOD to track project milestones, review submissions and exchange feedback.";

export const metadata: Metadata = {
  metadataBase: new URL("https://project-supervision-system.vercel.app"),
  title: {
    default: siteTitle,
    template: "%s · YABATECH Project Supervision",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://project-supervision-system.vercel.app",
    siteName: "YABATECH Project Supervision",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable + " font-sans antialiased"}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
