import React from 'react';
import NavBar from "./NavBar";
import Footer from "./Footer";

import '../App.css';

const Layout = ({ children }) => (
	<>
		<NavBar />
		<div id="content-wrap">{children}</div>
		<Footer />
	</>
);

export default Layout;
