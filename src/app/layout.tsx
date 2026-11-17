import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RelayFlow — Web Electrical & Relay Simulator",
  description: "Interactive industrial relay simulation engine with native .rflow and .smrl support",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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
    <html lang="en" suppressHydrationWarning className="select-none">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('relayflow_saved_theme');
                  var theme = saved === 'light' ? 'light' : 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.style.backgroundColor = '#f8fafc';
                    document.documentElement.style.colorScheme = 'light';
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.style.backgroundColor = '#090b10';
                    document.documentElement.style.colorScheme = 'dark';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[#f8fafc] dark:bg-[#090b10] text-slate-900 dark:text-slate-100 min-h-screen overflow-hidden overscroll-none touch-none">
        {children}
      </body>
    </html>
  );
}
