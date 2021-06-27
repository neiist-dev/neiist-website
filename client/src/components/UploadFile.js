import React, { useState } from 'react'
import axios from 'axios'

const UploadFile = ({title, instructions, postUrl}) => {
    const [selectedFile, setSelectedFile] = useState();
    const [isFilePicked, setIsFilePicked] = useState(false);

    const handleChange = event => {
        setSelectedFile(event.target.files[0]);
        setIsFilePicked(true);
    }

    const handleSubmission = () => {
        const formData = new FormData();
        formData.append('File', selectedFile);
        axios.post(postUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    return (
        <div>
            <h1>{title}</h1>
            <label>{instructions}</label>
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
    )
}

export default UploadFile