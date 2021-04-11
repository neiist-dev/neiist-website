import React, { useState, useEffect } from "react"
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Carousel from 'react-bootstrap/Carousel'
import hashTalks from '../images/hash_talks.jpg'
import hashCode1 from '../images/hash_code_1.jpg'
import hashCode2 from '../images/hash_code_2.jpg'

const HashCode = ({ client }) => {
    const [carouselImages, setCarouselImages] = useState([])

    useEffect(() => {
        client.getEntries({ 'content_type': 'carouselImage' })
            .then((entries) => {
                console.log(entries.items)
                setCarouselImages(entries.items)
            })
    }, [])

    return (
        <>
            <NavBar />
            <Carousel style={{ margin: "10px 20vw" }}>
                {
                    carouselImages.map(carouselImage =>
                        <Carousel.Item key={carouselImage.sys.id}>
                            <img
                                className="d-block w-100"
                                src={`https:${carouselImage.fields.image.fields.file.url}`}
                                alt={carouselImage.fields.title}
                            />
                            <Carousel.Caption>
                                <h3>{carouselImage.fields.title}</h3>
                                <p>{carouselImage.fields.description}</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                    )
                }
            </Carousel>
            <Footer />
        </>
    )
}

export default HashCode