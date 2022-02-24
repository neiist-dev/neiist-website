import React, { useContext } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Link } from 'react-router-dom';
import logo from '../images/neiist_logo.png';
import UserDataContext from '../UserDataContext';

const NavBar = () => {
  const { userData, setUserData } = useContext(UserDataContext);

  return (
    <Navbar expand="lg">
      <Navbar.Brand as={Link} to="/">
        <img src={logo} height="40" alt="" />
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav style={{ marginRight: 'auto' }}>

          <Nav.Link as={Link} to="/atividades">
            Atividades
          </Nav.Link>
          <Nav.Link as={Link} to="/quemsomos">
            Quem Somos
          </Nav.Link>
          <Nav.Link as={Link} to="/curso">
            Curso
          </Nav.Link>
          <Nav.Link as={Link} to="/seccoes">
            Secções
          </Nav.Link>
          <Nav.Link as={Link} to="/estatutos">
            Estatutos
          </Nav.Link>
          <Nav.Link as={Link} to="/contactos">
            Contactos
          </Nav.Link>
          <Nav.Link as={Link} to="/loja">
            Loja
          </Nav.Link>

          <ActiveTecnicoStudentNavLink as={Link} to="/socios">
            Sócios
          </ActiveTecnicoStudentNavLink>

          <ActiveLMeicStudentNavLink as={Link} to="/thesismaster">
            Thesis Master
          </ActiveLMeicStudentNavLink>

          <AdminNavLink as={Link} to="/admin">
            Admin
          </AdminNavLink>

        </Nav>
        <Nav style={{ marginLeft: 'auto' }}>
          <LoginLogout userData={userData} setUserData={setUserData} />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

const ActiveTecnicoStudentNavLink = ({ as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isActiveTecnicoStudent) {
    return (
      <Nav.Link as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const ActiveLMeicStudentNavLink = ({ as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isActiveLMeicStudent) {
    return (
      <Nav.Link as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const AdminNavLink = ({ as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isAdmin) {
    return (
      <Nav.Link as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const LoginLogout = ({ userData, setUserData }) => {
  if (userData) return <Logout userData={userData} setUserData={setUserData} />;
  return <Login />;
};

const Login = () => (
  <Nav.Link
    href={
      'https://fenix.tecnico.ulisboa.pt/oauth/userdialog'
      + `?client_id=${process.env.REACT_APP_FENIX_CLIENT_ID}`
      + `&redirect_uri=${process.env.REACT_APP_FENIX_REDIRECT_URI}`
    }
  >
    LOGIN
  </Nav.Link>
);

const Logout = ({ userData, setUserData }) => (
  <>
    <Navbar.Text>{userData.displayName}</Navbar.Text>
    <Nav.Link
      as={Link}
      to="/"
      onClick={() => {
        window.sessionStorage.removeItem('accessToken');
        setUserData(null);
      }}
    >
      LOGOUT
    </Nav.Link>
  </>
);

export default NavBar;
