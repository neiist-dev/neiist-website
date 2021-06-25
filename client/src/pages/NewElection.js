import React, { useState, useEffect, useContext } from 'react'
import Button from 'react-bootstrap/Button'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import axios from 'axios'

const NewElection = () => {
    const [name, setName] = useState(null)
    return (
        <>
            <NavBar />
            <div style={{ margin: "10px 30vw" }}>
                <form method="post" action="#" id="#">
                    <div>
                        <label>New Election Name:</label>
                        <input type="text" name="name" onChange={event => setName(event.target.value)} />
                        <button
                            type="button"
                            className="btn btn-success btn-block"
                            onClick={() => {
                                axios.post(`http://localhost:5000/elections/${name}`)
                            }}
                        >
                            New Election
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </>
    )
}

export default NewElection