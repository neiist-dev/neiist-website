import React from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import logo from '../images/neiist_logo.png';


const NavBar = () =>
    <Navbar bg="dark" variant="dark" expand="sm">
        <Navbar.Brand href="/" >
            <img src={logo} height="40" className="d-inline-block align-top" alt="GCE logo" />
        </Navbar.Brand >
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse>
            <Nav>
                <Nav.Link href="/atividades">Atividades</Nav.Link>
                <Nav.Link href="/quemsomos">Quem Somos</Nav.Link>
                <Nav.Link href="/curso">Curso</Nav.Link>
                <Nav.Link href="/seccoes">Seccoes</Nav.Link>
                <Nav.Link href="/socios">Socios</Nav.Link>
                <Nav.Link href="/estatutos">Estatutos</Nav.Link>
                <Nav.Link href="/contactos">Contactos</Nav.Link>
            </Nav>
        </Navbar.Collapse>
    </Navbar>

export default NavBar