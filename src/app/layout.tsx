import { Secular_One } from "next/font/google";
import { ReactNode } from "react";
import { UserProvider } from "@/context/UserContext";
import NavBar from "@/components/layout/navbar/NavBar";
import Footer from "@/components/layout/Footer";
import "@/styles/globals.css";
import { cookies } from "next/headers";
import { cookies as nextCookies } from "next/headers";
import { ShopProvider } from "@/context/ShopContext";
import Cart from "@/components/shop/Cart";

const secularOne = Secular_One({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  display: "swap",
});

export const metadata = {
  title: "NEIIST",
  description: "Núcleo Estudantil de Informática do Instituto Superior Técnico",
};

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUserFromCookies(cookies());
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={secularOne.className}>
        <ShopProvider>
          <UserProvider initialUser={user}>
            <NavBar />
            <Cart />
            <main>{children}</main>
            <Footer />
          </UserProvider>
        </ShopProvider>
      </body>
    </html>
  );
}

async function getUserFromCookies(cookieStorePromise = nextCookies()) {
  const cookieStore = await cookieStorePromise;
  const userDataCookie = cookieStore.get("userData")?.value;
  if (!userDataCookie) return null;
  try {
    return JSON.parse(userDataCookie);
  } catch {
    return null;
  }
}
