import React, { useState, useEffect, useContext, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MantineProvider } from "@mantine/core";

import "./App.css";
import "@mantine/core/styles.css"; // importing required mantine styles
import "bootstrap/dist/css/bootstrap.min.css"; // importing required bootstrap styles

import UserDataContext from "./UserDataContext.js";

import Layout from "./components/Layout.jsx";
import LoadSpinner from "./hooks/loadSpinner.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const ShopPage = lazy(() => import("./pages/ShopPage.jsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.jsx"));
const RulesPage = lazy(() => import("./pages/RulesPage.jsx"));
const ContactsPage = lazy(() => import("./pages/ContactsPage.jsx"));
const ThesisMasterPage = lazy(() => import("./pages/ThesisMasterPage.jsx"));
const MemberPage = lazy(() => import("./pages/MemberPage.jsx"));
const AdminMenuPage = lazy(() => import("./pages/AdminMenuPage.jsx"));
const AdminAreasPage = lazy(() => import("./pages/AdminAreasPage.jsx"));
const AdminThesesPage = lazy(() => import("./pages/AdminThesesPage.jsx"));
const AdminElectionsPage = lazy(() => import("./pages/AdminElectionsPage.jsx"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage.jsx"));
const GacPage = lazy(() => import("./pages/GacPage.jsx"));
const CollabsPage = lazy(() => import("./pages/CollabsPage.jsx"));
const OrderPage = lazy(() => import("./pages/OrderPage.jsx"));

const AoCPage = lazy(() => import("./pages/aoc/AoCPage.jsx"));

const Error = ({ error, errorDescription }) => (
  <>
    <h1>{error}</h1>
    <p>{errorDescription}</p>
  </>
);

const App = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const [userData, setUserData] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const logout = () => {
    window.sessionStorage.removeItem("accessToken");
    setUserData(null);
    return null;
  };

  const authFromCode = async () => {
    const code = urlParams.get("code");
    const accessTokenResponse = await fetch(`/api/auth/accessToken/${code}`);
    const accessToken = await accessTokenResponse.text();
    window.sessionStorage.setItem("accessToken", accessToken);
  };

  const tryAuthFromSessionStorage = async () => {
    const accessToken = window.sessionStorage.getItem("accessToken");
    if (!accessToken) return null;

    const userDataResponse = await fetch(`/api/auth/userData/${accessToken}`);
    if (userDataResponse.status === 401) return logout();

    const userDataJson = await userDataResponse.json();
    setUserData(userDataJson);
    return userDataJson;
  };

  const Redirect = (user) =>
    window.location.replace(
      user?.isCollab ? "/collab" : user?.isMember ? "/socios" : "/"
    );

  useEffect(() => {
    async function auth() {
      if (urlParams.has("code")) {
        await authFromCode();
        const user = await tryAuthFromSessionStorage();
        await Redirect(user);
      } else {
        await tryAuthFromSessionStorage();
        setIsLoaded(true);
      }
    }
    auth();
  }, []);

  if (!isLoaded) {
    return <LoadSpinner />;
  }

  if (urlParams.has("error")) {
    return (
      <Error
        error={urlParams.get("error")}
        errorDescription={urlParams.get("error_description")}
      />
    );
  }

  return (
    <UserDataContext.Provider value={{ userData, setUserData }}>
      <MantineProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/*"
              element={
                <Layout>
                  <Suspense fallback={<LoadSpinner />}>
                    <DefinedRoutes />
                  </Suspense>
                </Layout>
              }
            />
            <Route
              path="/AoC"
              element={
                <Suspense fallback={<LoadSpinner />}>
                  <meta httpEquiv="refresh" content="0;URL='/concurso.html'" />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </UserDataContext.Provider>
  );
};

const DefinedRoutes = () => (
  <Routes>
    {/* PUBLIC */}
    <Route exact path="/" element={<HomePage />} />

    <Route path="/shop" element={<ShopPage />} />
    <Route path="/order/:orderId" element={<OrderPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />

    <Route path="/sobre_nos" element={<AboutPage />} />
    <Route path="/estatutos" element={<RulesPage />} />
    <Route path="/contactos" element={<ContactsPage />} />

    {/* AUTHENTICATED */}
    <Route
      path="/socio"
      element={<ActiveTecnicoStudentRoute children={<MemberPage />} />}
    />
    <Route
      path="/thesismaster"
      element={<ActiveLMeicStudentRoute children={<ThesisMasterPage />} />}
    />

    {/* ADMIN */}
    <Route
      exact
      path="/admin"
      element={<AdminRoute children={<AdminMenuPage />} />}
    />

    <Route
      path="/collab"
      element={<CollabRoute children={<CollabsPage />} />}
    />

    <Route path="/mag" element={<GacRoute children={<GacPage />} />} />

    {/* FALLBACK */}
    <Route path="/*" element={<Navigate to="/" replace />} />
  </Routes>
);

const PrivateRoute = ({ condition, children }) => {
  const { userData } = useContext(UserDataContext);
  return userData && (userData.isAdmin || userData[condition]) ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
};

const ActiveTecnicoStudentRoute = ({ children }) => (
  <PrivateRoute children={children} condition={"isActiveTecnicoStudent"} />
);

const ActiveLMeicStudentRoute = ({ children }) => (
  <PrivateRoute children={children} condition={"isActiveLMeicStudent"} />
);

const GacRoute = ({ children }) => (
  <PrivateRoute children={children} condition={"isGacMember"} />
);

const CollabRoute = ({ children }) => (
  <PrivateRoute children={children} condition={"isCollab"} />
);

const AdminRoute = ({ children }) => (
  <PrivateRoute children={children} condition={"isAdmin"} />
);

export default App;
