import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import { ThemeProvider } from "@/components/ThemeProvider";
import ServiceWorkerUpdater from "@/components/ServiceWorkerUpdater";
import OfflineBanner from "@/components/OfflineBanner";
import DevPanel from "@/components/DevPanel";

export const metadata: Metadata = {
  title: "SpendTrack",
  description: "Personal spending tracker",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SpendTrack" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-screen bg-slate-950">
        <ThemeProvider>
          <ServiceWorkerUpdater />
          <OfflineBanner />
          <AppChrome>{children}</AppChrome>
          <DevPanel />
        </ThemeProvider>
      </body>
    </html>
  );
}
