import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

const Layout = ({ children }) => (
  <>
    <NavBar />
    <div id="#content-wrap" style={{ paddingBottom: "6rem" }}>
      {children}
    </div>
    <Footer />
  </>
);

export default Layout;
