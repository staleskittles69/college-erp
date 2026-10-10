import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

const isOffline = process.env.DEMO_OFFLINE === "1";

export const metadata: Metadata = {
  title: "College ERP",
  description: "College ERP - Student & Admin Portal",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
        {!isOffline && <SpeedInsights />}
        {!isOffline && <Analytics />}
      </body>
    </html>
  );
}
