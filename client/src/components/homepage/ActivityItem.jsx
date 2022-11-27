import React from 'react';
import {Modal, Button} from 'react-bootstrap';
import style from '../../pages/css/HomePage.module.css'



const ActivityItem = ({image, title, description}) => {

    const [show, setShow] = React.useState(false);

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    const modal = (
        <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{description}</Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
            Close
            </Button>
        </Modal.Footer>
        </Modal>
    );

    return (
        <>
            <div className={style.column} style={{margin: "1em"}}>
                <div onClick={handleShow}>
                    <img src={image} className={style.activityImage}/>
                    <div className={style.activityText}> {title} </div>
                </div>
                {modal}
            </div>
        </>
    );
}

export default ActivityItem;