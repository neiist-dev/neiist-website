import ActivityItem from './ActivityItem';
import BlueWhiteBox from './BlueWhiteBox';

import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import esports from '../../images/eventos/esports.jpg';
import sweats from '../../images/eventos/sweats.png';
import churrasco from '../../images/eventos/churras.jpg';
import letstalk from '../../images/eventos/ltal.jpg';
import qtsm from '../../images/eventos/qtsm.jpg';
import python from '../../images/eventos/python.jpg';
import assembly from '../../images/eventos/assembly.jpg';
import c from '../../images/eventos/C.jpg';
import hashcode from '../../images/eventos/hashcode.jpg';

const LeftArrow = () => {
    return (
        <div>
            <p>{'<'}</p>
        </div>
    );
}

const RightArrow = () => {
    return (
        <div>
            <p>{'>'}</p>
        </div>
    );
}

const Activities = () => {

    return (
        <div style={{margin: "0em 0em 0em 0em"}}>
            <h1 style={{textAlign: "left"}}>Atividades</h1>
            <BlueWhiteBox>
                <Carousel
                    infinite
                    draggable={false}
                    slidesToSlide={1}
                    autoPlay
                    autoPlaySpeed={2000}
                    responsive={{
                        desktop: {
                            breakpoint: {
                            max: 3000,
                            min: 1024
                            },
                            items: 3
                        },
                        mobile: {
                            breakpoint: {
                            max: 464,
                            min: 0
                            },
                            items: 1
                        },
                        tablet: {
                            breakpoint: {
                            max: 1024,
                            min: 464
                            },
                            items: 2
                        }
                    }}
                >
                    <ActivityItem 
                    image={esports} 
                    title="Torneio de E-Sports" 
                    description=""
                    />
                    <ActivityItem 
                    image={sweats} 
                    title="Sweats EIC" 
                    description=""
                    />
                    <ActivityItem 
                    image={churrasco} 
                    title="Churrasco EIC" 
                    description=""
                    />
                    <ActivityItem 
                    image={letstalk} 
                    title="Let's Talk About LEIC" 
                    description=""
                    />
                    <ActivityItem
                    image={qtsm}
                    title="Quase Tudo Sobre MEIC"
                    description=""
                    />
                    <ActivityItem
                    image={python}
                    title="Workshop de Python"
                    description=""
                    />
                    <ActivityItem
                    image={assembly}
                    title="Workshop Assembly"
                    description=""
                    />
                    <ActivityItem
                    image={c}
                    title="Workshop C"
                    description=""
                    />
                    <ActivityItem
                    image={hashcode}
                    title="Hash Code"
                    description=""
                    />
                </Carousel>
            </BlueWhiteBox>
        </div>
    );
}

export default Activities;