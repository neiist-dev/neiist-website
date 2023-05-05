import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import {
	BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css"; // importing required bootstrap styles

import UserDataContext from "./UserDataContext";

import Layout from "./components/Layout";
import LoadSpinner from "./hooks/loadSpinner";

const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const RulesPage = lazy(() => import("./pages/RulesPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const ThesisMasterPage = lazy(() => import("./pages/ThesisMasterPage"));
const MemberPage = lazy(() => import("./pages/MemberPage"));
const AdminMenuPage = lazy(() => import("./pages/AdminMenuPage"));
const AdminAreasPage = lazy(() => import("./pages/AdminAreasPage"));
const AdminThesesPage = lazy(() => import("./pages/AdminThesesPage"));
const AdminElectionsPage = lazy(() => import("./pages/AdminElectionsPage"));
const GacPage = lazy(() => import("./pages/GacPage"));
const CollabsPage = lazy(() => import("./pages/CollabsPage"));

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
    window.sessionStorage.removeItem('accessToken');
    setUserData(null);
    return null;
  };

  const authFromCode = async () => {
    const code = urlParams.get('code');
    const accessTokenResponse = await fetch(`/api/auth/accessToken/${code}`);
    const accessToken = await accessTokenResponse.text();
    window.sessionStorage.setItem('accessToken', accessToken);
  };

  const tryAuthFromSessionStorage = async () => {
    const accessToken = window.sessionStorage.getItem('accessToken');
    if (!accessToken) return null;

    const userDataResponse = await fetch(`/api/auth/userData/${accessToken}`);
    if (userDataResponse.status === 401) return logout();

    const userDataJson = await userDataResponse.json();
    setUserData(userDataJson);
    return userDataJson;
  };

  const Redirect = (user) => window.location.replace(
    user?.isCollab ? '/collab':
    user?.isMember ? '/socios':
    '/'
  );

  useEffect(() => {
    async function auth() {
      if (urlParams.has('code')) {
        await authFromCode();
        const user = await tryAuthFromSessionStorage();
        await Redirect(user);
      }
      else {
        await tryAuthFromSessionStorage();
        setIsLoaded(true);
      }
    }
    auth();
  }, []);

  if (!isLoaded) {
    return <LoadSpinner />;
  }

  if (urlParams.has('error')) {
    return (
      <Error
        error={urlParams.get('error')}
        errorDescription={urlParams.get('error_description')}
      />
    );
  }

  return (
    <UserDataContext.Provider value={{ userData, setUserData }}>
			<BrowserRouter>
				<Layout>
					<Suspense fallback={<LoadSpinner />}>
						<DefinedRoutes />
					</Suspense>
				</Layout>
			</BrowserRouter>
		</UserDataContext.Provider>
  );
};

const DefinedRoutes = () => (
  <Routes>
    {/* PUBLIC */}
    <Route exact path="/" element={<HomePage />} />

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
      path="/admin/areas"
      element={<AdminRoute children={<AdminAreasPage />} />}
    />
    <Route
      path="/admin/theses"
      element={<AdminRoute children={<AdminThesesPage />} />}
    />
    <Route
      path="/admin/elections"
      element={<AdminRoute children={<AdminElectionsPage />} />}
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
  return (userData && userData[condition])
    ? children : <Navigate to="/" replace />;
};

const ActiveTecnicoStudentRoute = ({ children }) => (
	<PrivateRoute children={children} condition={'isActiveTecnicoStudent'} />
);

const ActiveLMeicStudentRoute = ({ children }) => (
  <PrivateRoute children={children} condition={'isActiveLMeicStudent'} />
);

const GacRoute = ({ children }) => (
  <PrivateRoute children={children} condition={'isGacMember'} />
);

const CollabRoute = ({ children }) => (
  <PrivateRoute children={children} condition={'isCollab'} />
);

const AdminRoute = ({ children }) => (
  <PrivateRoute children={children} condition={'isAdmin'} />
);

export default App;
