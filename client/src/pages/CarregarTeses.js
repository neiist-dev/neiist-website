import React, { useState } from 'react'
import axios from 'axios'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

const CarregarTeses = ({ userData, setUserData }) => {
    const [htmlContent, setHtmlContent] = useState(null)

    return (
        <>
            <NavBar userData={userData} setUserData={setUserData} />
            <div style={{ margin: "10px 30vw" }}>
                <form method="post" action="#" id="#">
                    <div>
                        <label>
                            Instructions:<br />
                            * Get a file with thesis on ESTUDANTE &gt; Candidatura a Dissertação &gt; Available Proposals<br />
                            * Delete everything above the theses' beggining on &lt;tbody&gt;. Delete everything after &lt;/tbody&gt;
                        </label>
                        <input type="text" name="file" onChange={event => setHtmlContent(event.target.value)} />
                        <button
                            type="button"
                            className="btn btn-success btn-block"
                            onClick={() => {
                                console.log(htmlContent)
                                axios.post("http://localhost:5000/theses/upload", { htmlContent: htmlContent })
                            }}
                        >
                            Upload
                        </button>
                    </div>
                </form>
            </div>
            <Footer />
        </>
    )
}

export default CarregarTeses