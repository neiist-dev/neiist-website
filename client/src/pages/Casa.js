import React from 'react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Carousel from 'react-bootstrap/Carousel'
import neiist_banner from '../images/neiist_banner.jpg'
import alameda from '../images/alameda.jpg'
import taguspark from '../images/taguspark.jpg'

const Casa = () =>
    <>
        <NavBar />
        <Carousel >
            <Carousel.Item>
                <img
                    style={{ display: "block", width: "100%", height: "100vh", objectFit: "cover"  }}
                    src={neiist_banner}
                />
            </Carousel.Item>
            <Carousel.Item >
                <img
                    style={{ display: "block", width: "100%", height: "100vh", objectFit: "cover"  }}
                    src={alameda}
                />
            </Carousel.Item>
            <Carousel.Item >
                <img
                    style={{ display: "block", width: "100%", height: "100vh", objectFit: "cover"  }}
                    src={taguspark}
                />
            </Carousel.Item>
        </Carousel>
        <div style={{margin: "10px 20vw"}}>
            <h1 style={{ textAlign: "center" }}>
                MISSÃO
            </h1>
            <p>
                O NEIIST ambiciona ser o núcleo que integra, apoia e dinamiza todos os grupos, comunidades e iniciativas com impacto no percurso de estudantes do IST com interesses em Tecnologias de Informação.<br/>
                Para tal, pretende criar uma plataforma que promova a cooperação entre estudantes, e entre estes e docentes, órgãos institucionais e empresas, centrada na criação de oportunidades e no associativismo e valorização pessoal.
            </p>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <h1 style={{ textAlign: "center" }}>
                OBJETIVOS
            </h1>
            <p>
                Organizar diversas Atividades no âmbito da informática e valorização pessoal;<br />
                Estimular o interesse pela informática e a divulgação da mesma dentro e fora do Instituto Superior Técnico;<br/>
                Contribuir para o relacionamento nacional e internacional dos estudantes de informática e de outras áreas afins;<br />
                Estimular o associativismo e o espírito de equipa dentro das licenciaturas da responsabilidade do Departamento de Engenharia Informática do Instituto Superior Técnico (DEI);<br />
                Promover a imagem das licenciaturas, mestrados e doutoramentos da responsabilidade do DEI;<br />
                Promover o relacionamento entre professores, alunos, profissionais do ramo e empresas.
            </p>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <h1 style={{ textAlign: "center" }}>
                NOVIDADES
            </h1>
        </div>
        <div style={{width:"33%", backgroundColor:"white", position: "relative", margin: "auto", textAlign:"center", overflow: "hidden", paddingTop: "33.33%"}}>
            <iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FNEIIST%2F&tabs=timeline&width=600&height=900&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&appId" height="900" style={{position: "absolute", top: "0", left: "0", width: "100%", height: "100%",  border: "0", overflow:"hidden"}} scrolling="yes" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>
        </div>
        <Footer />
    </>

export default Casa