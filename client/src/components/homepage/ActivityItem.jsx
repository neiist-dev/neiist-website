import React from 'react';
import {Modal, Row, Col} from 'react-bootstrap';
import style from '../../pages/css/HomePage.module.css'
import activityItemStyle from '../css/ActivityItem.module.css'

const ActivityItem = ({image, title, description, setAutoPlay}) => {

    const [show, setShow] = React.useState(false);

    const handleShow = () => {setShow(true); setAutoPlay(false)};
    const handleClose = () => {setShow(false); setAutoPlay(true)};

    const modal = (
        <Modal contentClassName={activityItemStyle.main} show={show} onHide={handleClose}>
            <Modal.Header className={activityItemStyle.header}>
                <Modal.Title className={activityItemStyle.title}>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className={activityItemStyle.body}>
                {description}
            </Modal.Body>
        </Modal>
    );

    // TODO: make all images same size and border reach from star to end of the image
    return (
        <>
            <div onClick={handleShow} style={{padding: "0 25px"}}>
                <Col>
                    <Row>
                        <img src={image} className={style.activityImage}/>
                    </Row>
                    <Row>
                        <div className={style.activityText}> {title} </div>
                    </Row>
                </Col>
            </div>
            {modal}
        </>
    );
}

export default ActivityItem;