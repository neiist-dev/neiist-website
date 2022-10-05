import React, { useContext, useState } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Link } from 'react-router-dom';
import logo from '../images/neiist_logo.png';
import UserDataContext from '../UserDataContext';
import { GoSignOut } from "react-icons/go";
import { summarizeName, getMemberStatus, fenixPhoto, getStatusColor } from '../hooks/dataTreatment.jsx'
import { isMobile } from "react-device-detect";

import style from './css/NavBar.module.css'
import { useEffect } from 'react';

const NavBar = () => {
  const { userData, setUserData } = useContext(UserDataContext);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className={style.navBarContainer}>
        <Navbar expand="md" expanded={expanded} className={style.navBar}>
          <Navbar.Brand as={Link} to="/">
            <img src={logo} alt="NEIIST LOGO" />
          </Navbar.Brand>
          <Navbar.Toggle onClick={() => setExpanded(expanded ? false : "expanded")}/>
          <Navbar.Collapse>
            <Nav style={{ marginLeft: 'auto' }} onClick={() => setExpanded(false)}>
              <Nav.Link className={`${style.navLink} ${style.onWeb}`} as={Link} to="/sobre_nos">
                Sobre nós
              </Nav.Link>
              <Nav.Link className={`${style.navLink} ${style.onWeb}`} as={Link} to="/contactos">
                Contactos
              </Nav.Link>
              <Nav.Link className={`${style.navLink} ${style.onWeb}`} as={Link} to="/estudante">
                Estudante
              </Nav.Link>

              <ActiveTecnicoStudentNavLink hide={style.onMobile} as={Link} to="/socio">
                Sócios
              </ActiveTecnicoStudentNavLink>

              <ActiveLMeicStudentNavLink hide={style.onMobile} as={Link} to="/thesismaster">
                Thesis Master
              </ActiveLMeicStudentNavLink>

              <AdminNavLink hide={style.onMobile} as={Link} to="/admin">
                Admin
              </AdminNavLink>

              <GacNavLink hide={style.onMobile} as={Link} to="/mag">
                MAG
              </GacNavLink>
              <LoginLogout userData={userData} setUserData={setUserData} />
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </div>
      <div className={style.navSpace}/>
    </>
  );
};

const ActiveTecnicoStudentNavLink = ({ hide, as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isActiveTecnicoStudent) {
    return (
      <Nav.Link className={`${style.navLink} ${hide}`} as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const ActiveLMeicStudentNavLink = ({ hide, as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isActiveLMeicStudent) {
    return (
      <Nav.Link className={`${style.navLink} ${hide}`} as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const GacNavLink = ({ hide, as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isGacMember) {
    return (
      <Nav.Link className={`${style.navLink} ${hide}`} as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const AdminNavLink = ({ hide, as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && userData.isAdmin) {
    return (
      <Nav.Link className={`${style.navLink} ${hide}`} as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const LoginLogout = ({ userData, setUserData }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (userData){
      fetch(`/api/members/status/${userData.username}`)
      .then((res) => res.json())
      .then(
        (fetchStatus) => {
          let newData = userData;
          newData.status = (fetchStatus) ? fetchStatus : "NaoSocio";
          setData(userData);
        }
      );
    }
  }, [userData]);

  if (data) return <LoggedIn userData={data} setUserData={setUserData} />;
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
    <div style={{width: '80px', height: '30px', justifyContent:'center', background: '#D9D9D9', borderRadius: '10px', fontFamily: 'Secular One', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '30px', display: 'flex', alignItems: 'center', textAlign: 'center', color: '#000000',}}>Login</div>
  </Nav.Link>
);

const Logout = ({ setUserData }) => (
  <Nav.Link className={style.navLinkLogout} as={Link} to="/" onClick={() => {
    const removeAcessToken = new Promise(()=> {window.sessionStorage.removeItem('accessToken')});
    removeAcessToken.then(()=>{setUserData(null)});
  }}>
    <GoSignOut style={{width:'25px', alignItems: 'center', color: 'black'}}/>
  </Nav.Link>
);

const LoggedIn = ({ userData, setUserData }) => {
  const [click, setClick] = useState(false);
  const [show, setShow] = useState (false)

  return (
    <>
      <div className={`${style.loggedSpace} ${style.onlyWeb}`}>
        {!isMobile ?
          <Nav.Link style={{padding: '0'}} as={Link} to="/socio">
            <div className={style.loggedSpaceClickableArea} 
            onClick={()=>{if (isMobile)  {setClick(!click); setShow(!click);}}}
            onMouseEnter={()=>{setShow(true);}}
            onMouseLeave={()=>{setShow(click);}} />
          </Nav.Link>
          :
          <div className={style.loggedSpaceClickableArea} 
            onClick={()=>{{setClick(!click); setShow(!click);}}}/>
        }
        <div className={style.loggedImage}
          style={userData && {backgroundImage: `url(${fenixPhoto(userData.username)})`}}/>
        
        <div className={style.loggedInfo}>
          <div className={style.loggedName}> {summarizeName(userData.displayName)} </div>
    
          <div className={style.logoutButton_MemberState}>
            <Logout setUserData={setUserData}/>
            <div style={{borderRadius: '25px', marginRight: '7px', background: getStatusColor(userData.status) ,width: '125px', height: '22px', float: 'right'}}>
              <div className={style.memberStatus}> {getMemberStatus(userData.status)} </div>
            </div>
          </div>
        </div>
    
      </div>
      <div className={style.moreInfo} 
        onMouseEnter={()=>{setShow(true);}}
        onMouseLeave={()=>{setShow(click);}}
        style={show ? {display: 'flex'} : {display: 'none'}}>
        <ActiveTecnicoStudentNavLink hide={style.onWeb} as={Link} to="/socio">
          Sócio
        </ActiveTecnicoStudentNavLink>
    
        <ActiveLMeicStudentNavLink hide={style.onWeb} as={Link} to="/thesismaster">
          Thesis Master
        </ActiveLMeicStudentNavLink>
    
        <AdminNavLink hide={style.onWeb} as={Link} to="/admin">
          Admin
        </AdminNavLink>
    
        <GacNavLink hide={style.onWeb} as={Link} to="/mag">
          MAG
        </GacNavLink>
      </div>
    </>
  );
};

export default NavBar;
