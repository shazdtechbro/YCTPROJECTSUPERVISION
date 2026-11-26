import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
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
          {children}
          <Toaster closeButton position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
