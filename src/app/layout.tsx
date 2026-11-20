import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Secular_One } from "next/font/google";
import { Toaster } from "@neiist/ui";
import "@/styles/globals.css";

const secularOne = Secular_One({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-secular-one",
});

export const viewport: Viewport = {
  themeColor: "#f2f2f7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://neiist.tecnico.ulisboa.pt"),
  title: "NEIIST",
  description: "Núcleo Estudantil de Informática do Instituto Superior Técnico",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" className={secularOne.variable} suppressHydrationWarning>
      <body className={`${secularOne.className} ${secularOne.variable}`}>
        <Toaster position="top-right" offset={{ top: "96px", right: "16px", left: "16px" }} />
        {children}
      </body>
    </html>
  );
}
