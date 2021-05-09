import React from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

const Estatutos = ({ userData, setUserData }) =>
    <>
        <NavBar userData={userData} setUserData={setUserData} />
        <div style={{ margin: "10px 20vw" }}>
            <h2 style={{ textAlign: "center" }}>
                ESTATUTOS
            </h2>
            <p>FIXME</p>
        </div>
        <Footer />
    </>

export default Estatutos