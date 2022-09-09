import React, { useState, useEffect, useContext } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import Layout from './components/Layout';

import HomePage from './pages/HomePage';
import ActivitiesPage from './pages/ActivitiesPage';
import AboutPage from './pages/AboutPage';
import MajorPage from './pages/MajorPage';
import SubgroupsPage from './pages/SubgroupsPage';
import RulesPage from './pages/RulesPage';
import ContactsPage from './pages/ContactsPage';
import ShopPage from './pages/ShopPage';

import ThesisMasterPage from './pages/ThesisMasterPage';
import MemberPage from './pages/MemberPage';

import AdminMenuPage from './pages/AdminMenuPage';
import AdminAreasPage from './pages/AdminAreasPage';
import AdminThesesPage from './pages/AdminThesesPage';
import AdminElectionsPage from './pages/AdminElectionsPage';
import AdminShopPage from './pages/AdminShopPage';

import GacPage from './pages/GacPage';

import UserDataContext from './UserDataContext';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // importing required bootstrap styles
import "bootstrap-icons/font/bootstrap-icons.css"; // importing required bootstrap icon styles

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

  const authFromCode = async () => {
    const code = urlParams.get('code');
    const accessTokenResponse = await fetch(`/api/auth/accessToken/${code}`);
    const accessToken = await accessTokenResponse.text();
    
    window.sessionStorage.setItem('accessToken', accessToken);
    
    await fetch(`/api/auth/userData/${accessToken}`)
      .then((userDataResponse) => {
        window.location.replace('/').then(() => {
          const userDataJson = userDataResponse.json();
          if (userDataJson) setUserData(userDataJson)
        });
      });
  };

  const tryAuthFromSessionStorage = async () => {
    const accessToken = window.sessionStorage.getItem('accessToken');

    if (accessToken) {
      const userDataResponse = await fetch(`/api/auth/userData/${accessToken}`);
      const userDataJson = await userDataResponse.json();

      if (userDataJson) {
        setUserData(userDataJson);
      }
    }
  };

  useEffect(() => {
    async function auth() {
      if (urlParams.has('code')) await authFromCode();
      else await tryAuthFromSessionStorage();
      setIsLoaded(true);
    }
    auth();
  }, []);

  if (!isLoaded) {
    return <div>...</div>;
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
          <Switch>

            <Route exact path="/">
              <HomePage />
            </Route>
            <Route path="/atividades">
              <ActivitiesPage />
            </Route>
            <Route path="/quemsomos">
              <AboutPage />
            </Route>
            <Route path="/curso">
              <MajorPage />
            </Route>
            <Route path="/seccoes">
              <SubgroupsPage />
            </Route>
            <Route path="/estatutos">
              <RulesPage />
            </Route>
            <Route path="/contactos">
              <ContactsPage />
            </Route>
            <Route path="/loja">
              <ShopPage />
            </Route>

            <ActiveTecnicoStudentRoute path="/socios">
              <MemberPage />
            </ActiveTecnicoStudentRoute>

            <ActiveLMeicStudentRoute path="/thesismaster">
              <ThesisMasterPage />
            </ActiveLMeicStudentRoute>

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
            <AdminRoute path="/admin/shop">
              <AdminShopPage />
            </AdminRoute>

            <GacRoute path="/mag">
              <GacPage />
            </GacRoute>

            <Route path="/*">
              <Redirect to="/" />
            </Route>

          </Switch>
        </Layout>
      </Router>
    </UserDataContext.Provider>
  );
};

const ActiveTecnicoStudentRoute = ({ exact, path, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isActiveTecnicoStudent) {
    return (
      <Route exact={exact} path={path}>
        {children}
      </Route>
    );
  }
  return null;
};

const ActiveLMeicStudentRoute = ({ exact, path, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isActiveLMeicStudent) {
    return (
      <Route exact={exact} path={path}>
        {children}
      </Route>
    );
  }
  return null;
};

const GacRoute = ({ exact, path, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isGacMember) {
    return (
      <Route exact={exact} path={path}>
        {children}
      </Route>
    );
  }
  return null;
}

const AdminRoute = ({ exact, path, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isAdmin) {
    return (
      <Route exact={exact} path={path}>
        {children}
      </Route>
    );
  }
  return null;
};

export default App;
