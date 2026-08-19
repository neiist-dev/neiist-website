import { ReactNode, Suspense } from "react";
import { Metadata } from "next";
import { Secular_One } from "next/font/google";
import NavBar from "@/components/layout/navbar/NavBar";
import Footer from "@/components/layout/Footer";
import Cart from "@/components/shop/Cart";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import { ShopProvider } from "@/context/ShopContext";
import "@/styles/globals.css";
import "@/styles/components/activities/ReactBigCalendar.css";
import { cookies } from "next/headers";
import { getUserFromJWT } from "@/lib/auth";
import { getUser } from "@/lib/db/repositories/user.repository";

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

async function UserData({ children }: { children: ReactNode }) {
  let user = null;
  const sessionToken = (await cookies()).get("session")?.value;
  const jwtUser = getUserFromJWT(sessionToken);
  if (jwtUser?.istid) {
    try {
      user = await getUser(jwtUser.istid);
    } catch {
      // DB unreachable — degrade to guest
    }
  }
  return <UserProvider initialUser={user}>{children}</UserProvider>;
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={secularOne.className}>
        <ShopProvider>
          <Suspense fallback={null}>
            <UserData>
              <NavBar />
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
            </UserData>
          </Suspense>
        </ShopProvider>
      </body>
    </html>
  );
}
