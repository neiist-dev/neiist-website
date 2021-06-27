import React, { useState, useEffect, useContext } from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import logo from '../images/neiist_logo.png'
import { Redirect, Link } from "react-router-dom"
import { UserDataContext } from '../App'

const NavBar = () => {
  const { userData, setUserData } = useContext(UserDataContext)

  return (
    <Navbar expand="lg" >
      <Navbar.Brand as={Link} to="/">
        <img src={logo} height="40" alt="" />
      </Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse>
        <Nav style={{ marginRight: "auto" }}>
          <Nav.Link as={Link} to="/atividades">Atividades</Nav.Link>
          <Nav.Link as={Link} to="/quemsomos">Quem Somos</Nav.Link>
          <Nav.Link as={Link} to="/curso">Curso</Nav.Link>
          <Nav.Link as={Link} to="/seccoes">Secções</Nav.Link>
          <Nav.Link as={Link} to="/estatutos">Estatutos</Nav.Link>
          <Nav.Link as={Link} to="/contactos">Contactos</Nav.Link>
          {userData && userData.isNonAdmin &&
            <>
              <Nav.Link as={Link} to="/thesismaster">Thesis Master</Nav.Link>
              <Nav.Link as={Link} to="/socios">Sócios</Nav.Link>
            </>
          }
          {userData && userData.isAdmin &&
            <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
          }
        </Nav>
        <Nav style={{ marginLeft: "auto" }}>
          <LoginLogout userData={userData} setUserData={setUserData} />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

const LoginLogout = ({ userData, setUserData }) => {
  const urlParams = new URLSearchParams(window.location.search)

  if (urlParams.has("code") && userData)
    return <Redirect to="/theses" />

  if (urlParams.has("code"))
    return <CheckPermissions code={urlParams.get("code")} setUserData={setUserData} />

  if (urlParams.has("error"))
    return <Error error={urlParams.get("error")} errorDescription={urlParams.get("error_description")} />

  if (userData)
    return <Logout userData={userData} setUserData={setUserData} />

  return <Login />
}

const Login = () =>
  <Nav.Link
    href={'https://fenix.tecnico.ulisboa.pt/oauth/userdialog' +
      `?client_id=${process.env.REACT_APP_FENIX_CLIENT_ID}` +
      `&redirect_uri=${process.env.REACT_APP_FENIX_REDIRECT_URI}`}
  >
    LOGIN
  </Nav.Link>


const CheckPermissions = ({ code, setUserData }) => {
  const [error, setError] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:5000/auth?code=${code}`)
      .then(res => res.json())
      .then(userData => {
        setUserData(userData)
      },
        (err) => {
          setIsLoaded(true)
          setError(err)
        }
      )
  }, [])

  if (!isLoaded)
    return <div>Loading...</div>

  if (error)
    return <div>Error: {error.message}</div>
}

const Logout = ({ userData, setUserData }) =>
  <>
    <Navbar.Text>{userData.displayName}</Navbar.Text>
    <Nav.Link as={Link}
      to="/"
      onClick={() => setUserData(null)}
    >
      LOGOUT
    </Nav.Link>
  </>

const Error = ({ error, errorDescription }) =>
  <>
    <h1>{error}</h1>
    <p>{errorDescription}</p>
  </>

export default NavBar