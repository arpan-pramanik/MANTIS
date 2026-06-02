import type { Metadata } from "next";
import { PT_Serif, Instrument_Serif, Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const ptSerif = PT_Serif({ 
  weight: ['400', '700'], 
  style: ['normal', 'italic'], 
  subsets: ["latin"], 
  variable: "--font-pt-serif" 
});
const instrumentSerif = Instrument_Serif({ 
  weight: "400", 
  style: ['normal', 'italic'], 
  subsets: ["latin"], 
  variable: "--font-instrument-serif" 
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
      <body className={`${interTight.variable} ${ptSerif.variable} ${instrumentSerif.variable} font-sans antialiased bg-[#050505] text-white selection:bg-[#CCFF00] selection:text-black overflow-x-hidden cursor-none`}>
        {children}
      </body>
    </html>
  );
}
