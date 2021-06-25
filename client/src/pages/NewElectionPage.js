import React, { useState, useEffect, useContext } from 'react'
import Button from 'react-bootstrap/Button'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import axios from 'axios'

const NewElectionPage = () =>
    <>
        <NavBar />
        <NewElection />
        <Footer />
    </>

const NewElection = () => {
    const [electionId, setElectionId] = useState(null)

    if (!electionId) return <CreateElection setElectionId={setElectionId}/>
    else return <AddOptions electionId={electionId}/>
}

const CreateElection = ({ setElectionId}) => {
    const [name, setName] = useState(null)

    const handleOnClick = async () => {
        let res = await axios.post(`http://localhost:5000/elections/${name}`)
        const { id } = res.data
        // const id = res.json()
        setElectionId(id)
    }

    return (
        <div style={{ margin: "10px 30vw" }}>
            <form method="post" action="#" id="#">
                <div>
                    <label>New Election Name:</label>
                    <input type="text" name="name" onChange={event => setName(event.target.value)} />
                    <button type="button" onClick={handleOnClick}>
                        New Election
                            </button>
                </div>
            </form>
        </div>
    )
}

const AddOptions = ({ electionId}) =>
    <p>{electionId}</p>
    // <div style={{ margin: "10px 30vw" }}>
    //     <form method="post" action="#" id="#">
    //         <div>
    //             <label>New Election Name:</label>
    //             <input type="text" name="name" onChange={event => setName(event.target.value)} />
    //             <button type="button" onClick={handleOnClick}>
    //                 New Election
    //                     </button>
    //         </div>
    //     </form>
    // </div>

export default NewElectionPage