import "~/styles/globals.css";
import { Geist, Inter, Sora } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import type { Metadata } from "next";

// Bump ICON_VERSION whenever the icon files in /public change, so browsers
// fetch the new icons instead of showing a cached old one.
const ICON_VERSION = "2";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "48x48" },
      { url: `/favicon-96x96.png?v=${ICON_VERSION}`, type: "image/png", sizes: "96x96" },
    ],
    apple: `/apple-touch-icon.png?v=${ICON_VERSION}`,
  },
  manifest: "/site.webmanifest",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${sora.variable} ${inter.variable}`}
    >
      <body className="font-sans">
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
