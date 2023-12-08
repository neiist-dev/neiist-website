import React from 'react'

import ActivityItem from './ActivityItem.jsx';
import BlueWhiteBox from './BlueWhiteBox.jsx';

import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import esports from '../../images/eventos/esports.jpg';
import sweats from '../../images/eventos/sweats.jpg';
import churrasco from '../../images/eventos/churras.jpg';
import jantar from '../../images/eventos/jantar_curso.jpg'
import letstalk from '../../images/eventos/ltal.jpg';
import qtsm from '../../images/eventos/qtsm.jpg';
import python from '../../images/eventos/python.jpg';
import assembly from '../../images/eventos/assembly.jpg';
import c from '../../images/eventos/C.jpg';
import hashcode from '../../images/eventos/hashcode.jpg';
import lip from '../../images/eventos/lip.jpg';
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
                    description="E o que achas de teres uma sweat com o nome do teu curso? Não te esqueças, o NEIIST dá-te a oportunidade de teres a sweat do melhor curso!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem 
                    image={churrasco} 
                    title="Churrasco EIC" 
                    description="Mesmo que fosse uma semana de projetos ou exames, haveria sempre tempo para um convívio com amigos!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={jantar}
                    title="Jantar de Curso"
                    description="Muito stressado com o Técnico? Nós também, junta-te aos teus colegas no melhor jantar de curso!  A cerveja já está a tua espera…"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem 
                    image={letstalk} 
                    title="Let's Talk About LEIC" 
                    description="Acabaste de chegar ao curso e sentes-te perdido? Vem aprender connosco todos os truques para sobreviveres! Com este evento, junto dos alunos mais velhos, vais compreender como funciona LEIC e as suas disciplinas."
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={qtsm}
                    title="(Quase) Tudo Sobre MEIC"
                    description="Vais entrar em MEIC? Se estás indeciso sobre quais áreas ou cadeiras escolher, vem assistir a estas sessões! Irão explicar-te tudo o que precisas saber sobre a estrutura do mestrado, o currículo, as diferentes áreas de especialização, a tese e muito mais."
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={python}
                    title="Workshop de Python"
                    description="Estás preocupado com o projeto de FP ou queres aprender mais sobre Python? Vem a este workshop onde vamos falar das principais bases da programação e ensinar-te os primeiros passos essenciais para o mundo informático!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={assembly}
                    title="Workshop Assembly"
                    description="Não sabes o que quer dizer MOV, ADD, CMP? Não sabes o que são registos e flags? Então junta-te a nós neste workshop onde te ensinamos as bases de Assembly que irão ser fundamentais em IAC!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={c}
                    title="Workshop C"
                    description="Queres finalmente perceber o que é alocação de memória, o que são ponteiros, como funciona a pilha e muito mais? Junta-te a nós neste workshop e tira todas as tuas dúvidas!"
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={hashcode}
                    title="Hash Code"
                    description="Junta-te a nós na competição de código desenvolvida pela Google na qual o NEIIST organiza uma Hub onde todos os alunos do técnico são bem-vindos a integrar e participar."
                    setAutoPlay={setAutoPlay}
                    />
                    <ActivityItem
                    image={lip}
                    title="Linux Install Party"
                    description="Vem instalar o Linux no teu PC, junto a alunos com experiência na área e na instalação dos vários flavors que o Linux tem para oferecer!"
                    setAutoPlay={setAutoPlay}
                    />
                </Carousel>
            </BlueWhiteBox>
        </div>
    );
}

export default Activities;
