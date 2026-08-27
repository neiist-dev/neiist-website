import { ReactNode, Suspense } from "react";
import { Metadata } from "next";
import { Secular_One } from "next/font/google";
import NavBar, { AuthWidget } from "@/components/layout/navbar/NavBar";
import LoginButton from "@/components/layout/navbar/LoginButton";
import Footer from "@/components/layout/Footer";
import Cart from "@/components/shop/Cart";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import { ShopProvider } from "@/context/ShopContext";
import "@/styles/globals.css";
import "@/styles/components/activities/ReactBigCalendar.css";
import { getAuthenticatedUser } from "@/lib/auth";

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

async function ServerAuthWidget() {
  const session = await getAuthenticatedUser();
  return <AuthWidget initialUser={session?.user ?? null} />;
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={secularOne.className}>
        <ShopProvider>
          <UserProvider initialUser={null}>
            <NavBar
              authSlot={
                <Suspense fallback={<LoginButton />}>
                  <ServerAuthWidget />
                </Suspense>
              }
            />
            <Cart />
            <Toaster
              position="top-right"
              offset={{ top: "96px", right: "16px", left: "16px" }}
              mobileOffset={{ top: "80px", right: "16px", left: "16px" }}
              toastOptions={{
                style: {
                  background: "white",
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
