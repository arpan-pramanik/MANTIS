import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  style: ['normal', 'italic'],
  variable: "--font-playfair" 
});

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
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-[#050505] text-white selection:bg-[#CCFF00] selection:text-black overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}
