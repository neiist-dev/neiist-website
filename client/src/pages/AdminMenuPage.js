import React from 'react'
import Button from 'react-bootstrap/Button'
import { Link } from "react-router-dom"

const AdminMenuPage = () =>
    <div style={{margin: "auto", width: "50%", textAlign: "center" }}>
        <Button as={Link} to="/admin/areas">Areas</Button>
        <Button as={Link} to="/admin/theses">Teses</Button>
        <Button as={Link} to="/admin/elections">Eleições</Button>
    </div>

export default AdminMenuPage