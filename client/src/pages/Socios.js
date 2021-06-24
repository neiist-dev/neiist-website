import React, { useState, useEffect, useContext } from 'react'
import Button from 'react-bootstrap/Button'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { Redirect, Link } from "react-router-dom"
import { UserDataContext } from '../App'
import axios from 'axios'

const Socios = () =>
    <>
        <NavBar />
        <MemberPage />
        <Footer />
    </>

const MemberPage = () => {
    const { userData } = useContext(UserDataContext)
    const [member, setMember] = useState(null)

    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetch(`http://localhost:5000/members/${userData.username}`)
            .then(res => res.json())
            .then(member => {
                setMember(member)
                setIsLoaded(true)
            },
                (err) => {
                    setIsLoaded(true)
                    setError(err)
                }
            )
    }, [])

    if (!isLoaded) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (!member) return <Register />
    if (member.isExpired) return <Renew />
    if (member.canVote) return <Vote />
    else return <CantVote />
}

const Register = () => {
    const { userData } = useContext(UserDataContext)

    return (
        <Button
            onClick={() => {
                axios.post(`http://localhost:5000/members/${userData.username}`)
            }}
        >
            REGISTAR
        </Button>
    )
}

const CantVote = () =>
    <p style={{ textAlign: "center" }}>
        AINDA NAO PODES VOTAR
    </p>

const Vote = () => {
    const { userData } = useContext(UserDataContext)

    return (
        <Button
            onClick={() => {
                // axios.post(`http://localhost:5000/members/${userData.username}`)
            }}
        >
            VOTAR
        </Button>
    )
}

const Renew = () => {
    const { userData } = useContext(UserDataContext)

    return (
        <Button
            onClick={() => {
                // axios.post(`http://localhost:5000/members/${userData.username}`)
            }}
        >
            RENOVAR
        </Button>
    )
}

export default Socios