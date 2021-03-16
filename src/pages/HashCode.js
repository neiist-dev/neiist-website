import React from "react"
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Carousel from 'react-bootstrap/Carousel'
import hashTalks from '../images/hash_talks.jpg'
import hashCode1 from '../images/hash_code_1.jpg'
import hashCode2 from '../images/hash_code_2.jpg'

const HashCode = () =>
    <>
        <NavBar />
        <Carousel style={{ margin: "10px 20vw" }}>
            <Carousel.Item>
                <img
                    className="d-block w-100"
                    src={hashTalks}
                    alt="Hash Talks 2020"
                />
                <Carousel.Caption>
                    <h3>Hash Talks 2020</h3>
                    <p>powered by Talkdesk</p>
                </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
                <img
                    className="d-block w-100"
                    src={hashCode1}
                    alt="Hash Code 2020"
                />

                <Carousel.Caption>
                    <h3>Hash Code 2020</h3>
                    <p>A Competição</p>
                </Carousel.Caption>
            </Carousel.Item>
            <Carousel.Item>
                <img
                    className="d-block w-100"
                    src={hashCode2}
                    alt="Hash Code 2020"
                />

                <Carousel.Caption>
                    <h3>Hash Code 2020</h3>
                    <p>A Pizza</p>
                </Carousel.Caption>
            </Carousel.Item>
        </Carousel>
        <Footer />
    </>

export default HashCode