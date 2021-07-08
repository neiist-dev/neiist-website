import React, { useState, useContext } from "react";
import Layout from "./components/Layout";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import ActivitiesPage from "./pages/ActivitiesPage";
import AboutPage from "./pages/AboutPage";
import MajorPage from "./pages/MajorPage";
import SubgroupsPage from "./pages/SubgroupsPage";
import RulesPage from "./pages/RulesPage";
import ContactsPage from "./pages/ContactsPage";

import ThesisMasterPage from "./pages/ThesisMasterPage";
import MemberPage from "./pages/MemberPage";

import AdminMenuPage from "./pages/AdminMenuPage";
import AdminAreasPage from "./pages/AdminAreasPage";
import AdminThesesPage from "./pages/AdminThesesPage";
import AdminElectionsPage from "./pages/AdminElectionsPage";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

export const UserDataContext = React.createContext();

const App = () => {
  const [userData, setUserData] = useState(null);

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

            <NonAdminRoute path="/thesismaster">
              <ThesisMasterPage />
            </NonAdminRoute>
            <NonAdminRoute path="/socios">
              <MemberPage />
            </NonAdminRoute>

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

            <Route path="/*">
              <Redirect to="/" />
            </Route>
          </Switch>
        </Layout>
      </Router>
    </UserDataContext.Provider>
  );
};

const NonAdminRoute = ({ children, ...props }) => {
  const { userData } = useContext(UserDataContext);

  return (
    <Route {...props}>
      {userData && userData.isNonAdmin ? children : <Redirect to="/" />}
    </Route>
  );
};

const AdminRoute = ({ children, ...props }) => {
  const { userData } = useContext(UserDataContext);

  return (
    <Route {...props}>
      {userData && userData.isAdmin ? children : <Redirect to="/" />}
    </Route>
  );
};

export default App;
