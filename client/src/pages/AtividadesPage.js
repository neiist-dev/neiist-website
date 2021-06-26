import React from 'react'
import Button from 'react-bootstrap/Button'
import esports from '../images/eventos/esports.jpg'
import sweats from '../images/eventos/sweats.png'
import churras from '../images/eventos/churras.jpg'
import jantar_curso from '../images/eventos/jantar_curso.jpg'
import ltal from '../images/eventos/ltal.jpg'
import qtsm from '../images/eventos/qtsm.jpg'
import python from '../images/eventos/python.jpg'
import assembly from '../images/eventos/assembly.jpg'
import C from '../images/eventos/C.jpg'
import hashcode from '../images/eventos/hashcode.jpg'

const Atividades = () =>
    <>
        <div style={{ margin: "10px 20vw" }}>
            <h1 style={{ textAlign: "center" }}>
                ATIVIDADES PASSADAS
            </h1>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <h2 style={{ textAlign: "center" }}>
                ESPORTS
            </h2>
            <p>
                Gostas de jogar? Que coincidência, este evento foi mesmo feito a pensar em ti! Reúne uma equipa e vem passar o dia connosco a jogar, comer e beber... e quem sabe ganhar um prémio ou outro!
            </p>
            <img
                style={{ display: "block", width: "100%" }}
                src={esports}
            />
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <h2 style={{ textAlign: "center" }}>
                VENDA DE SWEATS
            </h2>
            <p>
                Compra uma sweat com o nome do teu curso!
            </p>
            <img
                style={{ display: "block", width: "100%" }}
                src={sweats}
            />
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    CHURRASCO DE EIC
                </h2>
                <p>
                    Os projetos e avaliações estão aí à porta, mas há sempre tempo para uma cerveja com os amigos!
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={churras}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    JANTAR DE CURSO
                </h2>
                <p>
                    Muito stressado com o Técnico? Nós também, junta-te aos teus colegas no melhor jantar de curso!
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={jantar_curso}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    LET'S TALK ABOUT LEIC
                </h2>
                <p>
                    Se acabaste de chegar ao curso, vem a este evento aprender todos os truques para sobreviveres!
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={ltal}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    QUASE TUDO SOBRE MEIC
                </h2>
                <p>
                    Vais entrar em MEIC e estás indeciso quanto às áreas ou cadeiras a escolher? Vem assistir a estas sessões com professores!
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={qtsm}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    WORKSHOP DE PYTHON
                </h2>
                <p>
                    Estás preocupado com o projeto de FP ou queres aprender mais sobre Python? Vem a este workshop!
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={python}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    WORKSHOP DE ASSEMBLY
                </h2>
                <p>
                    Não sabes o que quer dizer MOV, ADD, CMP? Não sabes o que são registos e flags? Então junta-te a nós neste workshop onde te ensinamos as bases de Assembly!
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={assembly}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    WORKSHOP DE C
                </h2>
                <p>
                    Queres finalmente perceber o que são ponteiros, como funciona a pilha e muito mais? Junta-te a nós neste workshop e tira todas as tuas dúvidas!
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={C}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw" }}>
            <div>
                <h2 style={{ textAlign: "center" }}>
                    HASH CODE
                </h2>
                <p>
                    FIXME
                </p>
                <img
                    style={{ display: "block", width: "100%" }}
                    src={hashcode}
                />
            </div>
        </div>
        <div style={{ margin: "10px 20vw"}}>
            <p style={{ textAlign: "center" }}>
                Queres saber mais sobre as nossas atividades? Visita o nosso facebook!
            </p>
            <Button href="https://www.facebook.com/NEIIST/events/" target="_blank" rel="noreferrer" style={{ textAlign: "center" }}>VISITAR</Button>
        </div>
    </>

export default Atividades