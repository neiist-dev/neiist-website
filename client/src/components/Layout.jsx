import React, { Suspense } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import LoadSpinner from "../hooks/loadSpinner";


const Layout = ({ children }) => (
  <>
    <NavBar />
    <Suspense fallback={<LoadSpinner />}>
      <div id="#content-wrap" style={{ paddingBottom: "6rem" }}>
        {children}
      </div>
    </Suspense>
    <Footer />
  </>
);

export default Layout;
