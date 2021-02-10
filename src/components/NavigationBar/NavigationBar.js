import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import logo from './logo.png';


const NavigationBar = () =>
  <Navbar expand="sm">
    <Navbar.Brand href="/" >
      <img src={logo} width="40" height="40" className="d-inline-block align-top" alt="GCE logo" />
    </Navbar.Brand >
    <Navbar.Toggle aria-controls="basic-navbar-nav" />
    <Navbar.Collapse>
      <Nav>
        <Nav.Link href="/sobre">Sobre</Nav.Link>
        <Nav.Link href="fixme">Thesis Master</Nav.Link>
        <Nav.Link href="/hash-code">Hash Code</Nav.Link>
        <Nav.Link href="/blog">Blog</Nav.Link>
      </Nav>
    </Navbar.Collapse>
  </Navbar >

export default NavigationBar;
