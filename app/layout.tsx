import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
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
          <Nav />
          <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
          </main>
          <DevPanel />
        </ThemeProvider>
      </body>
    </html>
  );
}
