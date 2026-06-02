import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MANTIS | Threat Intelligence System",
  description: "Enterprise-grade API security gateway and threat detection engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-mantis-900 text-zinc-300 selection:bg-mantis-primary selection:text-black overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
