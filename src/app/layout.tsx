import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RelayFlow — Web Electrical & Relay Simulator",
  description: "Interactive industrial relay simulation engine with native .rflow and .smrl support",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090b10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark select-none">
      <body className="antialiased bg-[#090b10] text-slate-100 min-h-screen overflow-hidden overscroll-none touch-none">
        {children}
      </body>
    </html>
  );
}
