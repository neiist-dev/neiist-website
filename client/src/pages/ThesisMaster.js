import React from 'react'
import NavBar from '../components/NavBar'
import logo from '../images/thesis/logo-colors-dark-background.png'

const LandingPage = ({ userData, setUserData }) =>
    <div style={{ width: "100%", height: "100vh", backgroundColor: "#6DA5FF" }}>
        <NavBar userData={userData} setUserData={setUserData} />
        <img
            style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
            }}
            width="600vw"
            height="auto"
            src={logo} alt="" />
    </div>

export default LandingPage

