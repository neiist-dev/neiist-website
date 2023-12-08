import React from 'react';
import NavBar from "./NavBar.jsx";
import Footer from "./Footer.jsx";

import '../App.css';

const Layout = ({ children }) => (
	<>
		<NavBar />
		<div id="content-wrap">{children}</div>
		<Footer />
	</>
);

export default Layout;
