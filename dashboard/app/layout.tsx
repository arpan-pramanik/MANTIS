import type { Metadata } from "next";
import { Inter, Playfair_Display, DotGothic16 } from "next/font/google";
import "./globals.css";
import Preloader from "./components/Preloader";

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
  title: "MANTIS - Enterprise API Security",
  description: "Zero-trust architecture and real-time threat detection for your API infrastructure.",
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
      <body className="min-h-full flex flex-col bg-black text-[#EDEDED] font-sans overflow-x-hidden">
        <Preloader />
        <div className="md:hidden fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center p-8 text-center h-[100dvh] w-full pointer-events-auto">
          <div className="border border-brand-orange p-8 bg-[#050505] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange"></div>
            <h1 className="text-3xl font-serif text-white mb-4">Desktop <span className="italic text-brand-orange">Required</span></h1>
            <p className="text-[#888888] text-xs font-mono leading-relaxed mt-4">
              This enterprise gateway is architected specifically for desktop environments. Please access MANTIS from a desktop or laptop device to proceed.
            </p>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
