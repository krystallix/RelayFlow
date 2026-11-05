import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RelayFlow — Web Electrical & Relay Simulator",
  description: "Interactive industrial relay simulation engine with native .rflow and .smrl support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090b10] text-slate-100 min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
