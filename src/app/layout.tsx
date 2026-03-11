import { ReactNode } from "react";
import { Secular_One } from "next/font/google";
import NavBar from "@/components/layout/navbar/NavBar";
import Footer from "@/components/layout/Footer";
import Cart from "@/components/shop/Cart";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import { ShopProvider } from "@/context/ShopContext";
import "@/styles/globals.css";
import "@/styles/components/activities/ReactBigCalendar.css";

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

async function getInitialUser() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/userdata`, {
      cache: "no-store",
      credentials: "include",
      headers: { cookie: "" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getInitialUser();
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={secularOne.className}>
        <ShopProvider>
          <UserProvider initialUser={user}>
            <NavBar />
            <Cart />
            <Toaster
              toastOptions={{
                style: {
                  background: "var(--background-colour)",
                  color: "var(--foreground-colour)",
                },
              }}
            />
            <main>{children}</main>
            <Footer />
          </UserProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
