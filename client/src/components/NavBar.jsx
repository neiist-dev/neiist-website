import React, { useContext, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { Link } from "react-router-dom";
import logo from "../images/neiist_logo.png";
import UserDataContext from "../UserDataContext.js";
import { GoSignOut } from "react-icons/go";
import {
  summarizeName,
  statusToString,
  fenixPhoto,
  statusToColor,
} from "../hooks/dataTreatment.jsx";
import { isMobile } from "react-device-detect";

import style from "./css/NavBar.module.css";
import { useEffect } from "react";
import { fetchMemberStatus } from "../Api.service.js";

import ShoppingCart from "./ShoppingCart.jsx";
import { FaShoppingCart } from "react-icons/fa";
import { Button } from "react-bootstrap";

const NavBar = () => {
  const { userData, setUserData } = useContext(UserDataContext);
  const [expanded, setExpanded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // TODO: Implement cart count badge
  // const [itemCount, setItemCount] = useState(() => {
  //   try {
  //     // Get cart data and handle potential invalid JSON
  //     const cartData = localStorage.getItem("cart");
  //     if (!cartData) return 0;

  //     const cart = JSON.parse(cartData);
  //     // Ensure cart is an array and return its length
  //     return Array.isArray(cart) ? cart.length : 0;
  //   } catch (error) {
  //     // If there's any error parsing, reset cart and return 0
  //     localStorage.setItem("cart", "[]");
  //     return 0;
  //   }
  // });

  // useEffect(() => {
  //   const updateCartCount = () => {
  //     try {
  //       const cartData = localStorage.getItem("cart");
  //       if (!cartData) {
  //         setItemCount(0);
  //         return;
  //       }

  //       const cart = JSON.parse(cartData);
  //       setItemCount(Array.isArray(cart) ? cart.length : 0);
  //     } catch (error) {
  //       setItemCount(0);
  //     }
  //   };

  //   // Listen for cart updates
  //   window.addEventListener("storage", updateCartCount);
  //   window.addEventListener("cartUpdated", updateCartCount);

  //   // Initial check
  //   updateCartCount();

  //   return () => {
  //     window.removeEventListener("storage", updateCartCount);
  //     window.removeEventListener("cartUpdated", updateCartCount);
  //   };
  // }, []);

  return (
    <>
      <div className={style.navBarContainer}>
        <Navbar expand="md" expanded={expanded} className={style.navBar}>
          <Navbar.Brand as={Link} to="/">
            <img src={logo} alt="NEIIST LOGO" />
          </Navbar.Brand>
          <Navbar.Toggle
            onClick={() => setExpanded(expanded ? false : "expanded")}
          />
          <Navbar.Collapse>
            <Nav
              style={{ marginLeft: "auto" }}
              onClick={() => setExpanded(false)}
            >
              <Nav.Link
                className={`${style.navLink} ${style.onWeb}`}
                as={Link}
                to="/sobre_nos"
              >
                Sobre nós
              </Nav.Link>
              <Nav.Link
                className={`${style.navLink} ${style.onWeb}`}
                as={Link}
                to="/contactos"
              >
                Contactos
              </Nav.Link>
              <Nav.Link
                className={`${style.navLinkDisable} ${style.onWeb}`}
                as={Link}
              >
                Estudante
              </Nav.Link>
              <Nav.Link
                className={`${style.navLink} ${style.onWeb}`}
                as={Link}
                to="/shop"
              >
                Loja
              </Nav.Link>
              <Nav.Link
                className={`${style.cartLink} ${style.onWeb}`}
                onClick={() => setIsCartOpen(true)}
              >
                <FaShoppingCart size={20} />
                {/* {itemCount > 0 && (
                  <span className={style.cartBadge}>{itemCount}</span>
                )} */}
              </Nav.Link>

              <ActiveTecnicoStudentNavLink
                hide={style.onMobile}
                as={Link}
                to="/socio"
              >
                Sócios
              </ActiveTecnicoStudentNavLink>

              <CollabNavLink hide={style.onMobile} as={Link} to="/collab">
                Colaborador(a)
              </CollabNavLink>

              <ActiveLMeicStudentNavLink
                hide={style.onMobile}
                as={Link}
                to="/thesismaster"
              >
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
      <div className={style.navSpace} />
      <ShoppingCart show={isCartOpen} onHide={() => setIsCartOpen(false)} />
    </>
  );
};

const ActiveTecnicoStudentNavLink = ({ hide, as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && (userData.isAdmin || userData.isActiveTecnicoStudent)) {
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

  if (userData && (userData.isAdmin || userData.isActiveLMeicStudent)) {
    return (
      <Nav.Link className={`${style.navLink} ${hide}`} as={as} to={to}>
        {children}
      </Nav.Link>
    );
  }
  return null;
};

const CollabNavLink = ({ hide, as, to, children }) => {
  const { userData } = useContext(UserDataContext);

  if (userData && (userData.isAdmin || userData.isCollab)) {
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

  if (userData && (userData.isAdmin || userData.isGacMember)) {
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
    if (userData) {
      fetchMemberStatus(userData.username).then((userStatus) => {
        let newData = userData;
        newData.status = userStatus ? userStatus : "NaoSocio";
        setData(userData);
      });
    }
  }, [userData]);

  if (data) return <LoggedIn userData={data} setUserData={setUserData} />;
  return <Login />;
};

const Login = () => (
  <Nav.Link
    href={
      "https://fenix.tecnico.ulisboa.pt/oauth/userdialog" +
      `?client_id=${process.env.REACT_APP_FENIX_CLIENT_ID}` +
      `&redirect_uri=${process.env.REACT_APP_FENIX_REDIRECT_URI}`
    }
  >
    <div
      style={{
        width: "80px",
        height: "30px",
        justifyContent: "center",
        background: "#D9D9D9",
        borderRadius: "10px",
        fontFamily: "Secular One",
        fontStyle: "normal",
        fontWeight: 400,
        fontSize: "16px",
        lineHeight: "30px",
        display: "flex",
        alignItems: "center",
        textAlign: "center",
        color: "#000000",
      }}
    >
      Login
    </div>
  </Nav.Link>
);

const Logout = ({ setUserData }) => (
  <Nav.Link
    className={style.navLinkLogout}
    as={Link}
    to="/"
    onClick={() => {
      const removeAccessToken = new Promise(() => {
        window.sessionStorage.removeItem("accessToken");
      });
      removeAccessToken;
      setUserData(null);
      window.location.replace("/").reload(true);
    }}
  >
    <GoSignOut
      style={{ width: "25px", alignItems: "center", color: "black" }}
    />
  </Nav.Link>
);

const DefaultLink = ({ children }) =>
  isMobile ? children : <Link to="/socio">{children}</Link>;

const LoggedIn = ({ userData, setUserData }) => {
  const [click, setClick] = useState(false);
  const [show, setShow] = useState(false);

  const onMouseEnterFunction = () => {
    setShow(true);
  };
  const onMouseLeaveFunction = () => {
    setShow(click);
  };
  const onClickFunction = () => {
    isMobile && setClick(!click);
    setShow(!click);
  };

  return (
    <>
      <div className={`${style.loggedSpace} ${style.onlyWeb}`}>
        <DefaultLink
          children={
            <div
              className={style.loggedImage}
              onClick={onClickFunction}
              onMouseEnter={onMouseEnterFunction}
              onMouseLeave={onMouseLeaveFunction}
              style={
                userData && {
                  backgroundImage: `url(${fenixPhoto(userData.username)})`,
                }
              }
            />
          }
        />

        <div
          className={style.loggedInfo}
          onClick={onClickFunction}
          onMouseEnter={onMouseEnterFunction}
          onMouseLeave={onMouseLeaveFunction}
        >
          <DefaultLink
            children={
              <div className={style.loggedName}>
                {" "}
                {summarizeName(userData.displayName)}{" "}
              </div>
            }
          />

          <div className={style.logoutButton_MemberState}>
            <Logout setUserData={setUserData} />
            <DefaultLink
              children={
                <div
                  className={style.memberStatus}
                  style={{ background: statusToColor(userData.status) }}
                >
                  <div> {statusToString(userData.status)} </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
      <div
        className={style.moreInfo}
        onMouseEnter={onMouseEnterFunction}
        onMouseLeave={onMouseLeaveFunction}
        style={show ? { display: "flex" } : { display: "none" }}
      >
        <ActiveTecnicoStudentNavLink hide={style.onWeb} as={Link} to="/socio">
          Sócio
        </ActiveTecnicoStudentNavLink>

        <CollabNavLink hide={style.onWeb} as={Link} to="/collab">
          Colaborador(a)
        </CollabNavLink>

        <ActiveLMeicStudentNavLink
          hide={style.onWeb}
          as={Link}
          to="/thesismaster"
        >
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
