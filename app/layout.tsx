import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const roboto = localFont({
  src: "../public/fonts/roboto-latin-variable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
const siteTitle = "YABATECH Project Supervision System";
const siteDescription =
  "A YABATECH HND workspace for students, supervisors and the HOD to track project milestones, review submissions and exchange feedback.";
const socialPreview = {
  url: "/yabatech-og-preview.png",
  width: 1200,
  height: 630,
  alt: "YABATECH HND Project Supervision System",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://project-supervision-system.vercel.app"),
  title: { default: siteTitle, template: "%s · YABATECH Project Supervision" },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://project-supervision-system.vercel.app",
    siteName: "YABATECH Project Supervision",
    title: siteTitle,
    description: siteDescription,
    images: [socialPreview],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialPreview.url],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={roboto.variable + " font-sans antialiased"}>
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
