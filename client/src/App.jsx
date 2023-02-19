import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Redirect,
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
			<Router Router>
				<Layout>
					<Suspense fallback={<LoadSpinner />}>
						<Switch>
              {/* PUBLIC */}
							<Route exact path="/">
								<HomePage />
							</Route>

							<Route path="/sobre_nos">
								<AboutPage />
							</Route>
							<Route path="/estatutos">
								<RulesPage />
							</Route>
							<Route path="/contactos">
								<ContactsPage />
							</Route>

              {/* AUTHENTICATED */}
							<ActiveTecnicoStudentRoute path="/socio">
								<MemberPage />
							</ActiveTecnicoStudentRoute>
							<ActiveLMeicStudentRoute path="/thesismaster">
								<ThesisMasterPage />
							</ActiveLMeicStudentRoute>

              {/* ADMIN */}
							<AdminRoute exact path="/admin">
								<AdminMenuPage />
							</AdminRoute>
							<AdminRoute path="/admin/areas">
								<AdminAreasPage />
							</AdminRoute>
							<AdminRoute path="/admin/theses">
								<AdminThesesPage />
							</AdminRoute>
							<AdminRoute path="/admin/elections">
								<AdminElectionsPage />
							</AdminRoute>

              <CollabRoute path="/collab">
                <CollabsPage />
              </CollabRoute>

							<GacRoute path="/mag">
								<GacPage />
							</GacRoute>

              {/* FALLBACK */}
							<Route path="/*">
								<Redirect to="/" />
							</Route>
						</Switch>
					</Suspense>
				</Layout>
			</Router>
		</UserDataContext.Provider>
  );
};

const PrivateRoute = ({ exact, path, children }) => (
	<Route exact={exact} path={path}>
		{children}
	</Route>
);

const ActiveTecnicoStudentRoute = ({ exact, path, children }) => {
	const { userData } = useContext(UserDataContext);

	if (userData && userData.isActiveTecnicoStudent)
		return <PrivateRoute exact={exact} path={path} children={children} />;
	return <Redirect to="/" />;
};

const ActiveLMeicStudentRoute = ({ exact, path, children }) => {
	const { userData } = useContext(UserDataContext);

	if (userData && userData.isActiveLMeicStudent)
		return <PrivateRoute exact={exact} path={path} children={children} />;
	return <Redirect to="/" />;
};

const GacRoute = ({ exact, path, children }) => {
	const { userData } = useContext(UserDataContext);

  if (userData &&  userData.isGacMember) 
    return <PrivateRoute exact={exact} path={path} children={children}/>
  return <Redirect to="/"/>
};

const CollabRoute = ({ exact, path, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isCollab) 
    return <PrivateRoute exact={exact} path={path} children={children}/>
  return <Redirect to="/"/>
};

const AdminRoute = ({ exact, path, children }) => {
	const { userData } = useContext(UserDataContext);

	if (userData && userData.isAdmin)
		return <PrivateRoute exact={exact} path={path} children={children} />;
	return <Redirect to="/" />;
};

export default App;
