import React from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

const Seccoes = ({ userData, setUserData }) =>
    <>
        <NavBar userData={userData} setUserData={setUserData} />
        <div style={{ margin: "10px 20vw" }}>
            <h2 style={{ textAlign: "center" }}>
                FIXME
            </h2>
        </div>
        <Footer />
    </>

export default Seccoes