import { ReactNode } from "react";
import { Secular_One } from "next/font/google";
import { cookies } from "next/headers";
import NavBar from "@/components/layout/navbar/NavBar";
import Footer from "@/components/layout/Footer";
import Cart from "@/components/shop/Cart";
import { UserProvider } from "@/context/UserContext";
import { ShopProvider } from "@/context/ShopContext";
import "@/styles/globals.css";

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

async function getUserFromCookies(cookieStore = cookies()) {
  try {
    const store = await cookieStore;
    return JSON.parse(store.get("user_data")?.value ?? "null");
  } catch {
    return null;
  }
}

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
