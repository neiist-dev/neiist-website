import React from 'react'

import ActivityItem from './ActivityItem';
import BlueWhiteBox from './BlueWhiteBox';

import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import esports from '../../images/eventos/esports.jpg';
import sweats from '../../images/eventos/sweats.png';
import churrasco from '../../images/eventos/churras.jpg';
import jantar from '../../images/eventos/jantar_curso.jpg'
import letstalk from '../../images/eventos/ltal.jpg';
import qtsm from '../../images/eventos/qtsm.jpg';
import python from '../../images/eventos/python.jpg';
import assembly from '../../images/eventos/assembly.jpg';
import c from '../../images/eventos/C.jpg';
import hashcode from '../../images/eventos/hashcode.jpg';
import style from '../../pages/css/HomePage.module.css'

const Activities = () => {
    const [autoPlay, setAutoPlay] = React.useState('true');

    return (
        <div className={style.verticalMargin}>
            <h1>Atividades</h1>
            <BlueWhiteBox>
                <Carousel
                    infinite
                    draggable={false}
                    slidesToSlide={1}
                    autoPlay={autoPlay}
                    autoPlaySpeed={2500}
                    responsive={{
                        desktop: {
                            breakpoint: {
                            max: 3000,
                            min: 1024
                            },
                            items: 4
                        },
                        tablet: {
                            breakpoint: {
                            max: 1024,
                            min: 464
                            },
                            items: 3
                        },
                        mobile: {
                            breakpoint: {
                            max: 464,
                            min: 0
                            },
                            items: 2
                        }
                    }}
                >
                    <ActivityItem 
                    image={esports} 
                    title="Torneio de E-Sports" 
                    description="Gostas de jogar? Que coincidência, este evento foi mesmo feito a pensar em ti! Reúne uma equipa e vem passar o dia connosco a jogar, comer e beber... e quem sabe ganhar um prémio ou outro!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem 
                    image={sweats} 
                    title="Sweats EIC" 
                    description="Compra uma sweat com o nome do teu curso!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem 
                    image={churrasco} 
                    title="Churrasco EIC" 
                    description="Os projetos e avaliações estão aí à porta, mas há sempre tempo para uma cerveja com os amigos!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={jantar}
                    title="Jantar de Curso"
                    description="Muito stressado com o Técnico? Nós também, junta-te aos teus colegas no melhor jantar de curso!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem 
                    image={letstalk} 
                    title="Let's Talk About LEIC" 
                    description="Se acabaste de chegar ao curso, vem a este evento aprender todos os truques para sobreviveres!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={qtsm}
                    title="(Quase) Tudo Sobre MEIC"
                    description="Vais entrar em MEIC e estás indeciso quanto às áreas ou cadeiras a escolher? Vem assistir a estas sessões com professores!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={python}
                    title="Workshop de Python"
                    description="Estás preocupado com o projeto de FP ou queres aprender mais sobre Python? Vem a este workshop!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={assembly}
                    title="Workshop Assembly"
                    description="Não sabes o que quer dizer MOV, ADD, CMP? Não sabes o que são registos e flags? Então junta-te a nós neste workshop onde te ensinamos as bases de Assembly!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={c}
                    title="Workshop C"
                    description="Queres finalmente perceber o que são ponteiros, como funciona a pilha e muito mais? Junta-te a nós neste workshop e tira todas as tuas dúvidas!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={hashcode}
                    title="Hash Code"
                    description=""
                    setAutoPlay={setAutoPlay}
                    />
                </Carousel>
            </BlueWhiteBox>
        </div>
    );
}

export default Activities;