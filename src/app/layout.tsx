import { ReactNode } from "react";
import { Metadata } from "next";
import { Secular_One } from "next/font/google";
import { Toaster } from "@neiist/ui";
import "@/styles/globals.css";
import "@/styles/components/activities/ReactBigCalendar.css";

const secularOne = Secular_One({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEIIST",
  description: "Núcleo Estudantil de Informática do Instituto Superior Técnico",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={secularOne.className}>
        <Toaster position="top-right" offset={{ top: "96px", right: "16px", left: "16px" }} />
        {children}
      </body>
    </html>
  );
}
