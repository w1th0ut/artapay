import type { Metadata } from "next";
import { Poppins, Cinzel } from "next/font/google";
import "./globals.css";
import Web3Provider from "@/providers/Web3Provider";
import banner from "@/assets/banner.png";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArtaPay - Seamless Cross-Border Payments",
  description: "Any Stablecoin. Anywhere. Gasless.",
  metadataBase: new URL("https://artapay.vercel.app"),
  openGraph: {
    title: "ArtaPay - Seamless Cross-Border Payments",
    description: "Any Stablecoin. Anywhere. Gasless.",
    type: "website",
    images: [
      {
        url: banner.src,
        alt: "ArtaPay banner",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${cinzel.variable} antialiased`}
      >
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
