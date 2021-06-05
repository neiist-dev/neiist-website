import React, { useState } from 'react'
import axios from 'axios'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

const CarregarTeses = ({ userData, setUserData }) => {
    const [selectedFile, setSelectedFile] = useState();
    const [isFilePicked, setIsFilePicked] = useState(false);

    const handleChange = event => {
        setSelectedFile(event.target.files[0]);
        setIsFilePicked(true);
    }

    const handleSubmission = () => {
        const formData = new FormData();
        formData.append('File', selectedFile);
        axios.post("http://localhost:5000/theses/upload", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    return (
        <>
            <NavBar userData={userData} setUserData={setUserData} />
            <div style={{ margin: "10px 30vw" }}>
                <div>
                    <label>
                        Instructions:<br />
                        * Get a file with thesis on ESTUDANTE &gt; Candidatura a Dissertação &gt; Available Proposals<br />
                        * Delete everything above the theses' beggining on &lt;tbody&gt;. Delete everything after &lt;/tbody&gt;
                    </label>
                    <input type="file" onChange={handleChange} />
                    {isFilePicked ?
                    <div>
                        <p>Filename: {selectedFile.name}</p>
                        <p>Filetype: {selectedFile.type}</p>
                        <p>Size in bytes: {selectedFile.size}</p>
                    </div>
                    :
                    <p>Select a file to show details</p>
                    }
                    <button onClick={handleSubmission}>Upload</button>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default CarregarTeses