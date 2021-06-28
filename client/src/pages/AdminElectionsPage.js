import React, { useState, useEffect, useContext } from 'react'
import Button from 'react-bootstrap/Button'
import axios from 'axios'

const AdminElectionsPage = () => {
    const [name, setName] = useState(null)
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [options, setOptions] = useState(null)

    const handleOnClick = async () => {
        const newElection = {
            name: name,
            startDate: startDate,
            endDate: endDate,
            options: options.split(',')
        }

        axios.post(`http://localhost:5000/elections`, newElection)
    }

    return (
        <div style={{ margin: "10px 30vw" }}>
            <form method="post" action="#" id="#">
                <div>
                    <label>Nome:</label>
                    <input type="text" name="name" onChange={event => setName(event.target.value)} required/>
                    <br/>
                    <label>Data de Início:</label>
                    <input type="date" name="startDate" onChange={event => setStartDate(event.target.value)} required/>
                    <br />
                    <label>Data de Fim:</label>
                    <input type="date" name="endDate" onChange={event => setEndDate(event.target.value)} required/>
                    <br />
                    <label>Opções separadas por vírgulas:</label>
                    <input type="text" name="options" onChange={event => setOptions(event.target.value)} required />
                    <br />
                    <button type="button" onClick={handleOnClick}>New Election</button>
                </div>
            </form>
        </div>
    )
}

export default AdminElectionsPage