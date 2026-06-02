import type { Metadata } from "next";
import { Inter, Playfair_Display, DotGothic16 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const dotgothic = DotGothic16({
  weight: "400",
  variable: "--font-dotgothic",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FURO Clone",
  description: "Websites that speak in your brand's voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${dotgothic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-[#EDEDED] font-sans overflow-x-hidden">{children}</body>
    </html>
  );
}
