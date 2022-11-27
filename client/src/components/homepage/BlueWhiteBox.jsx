import style from '../../pages/css/HomePage.module.css'

const BlueWhiteBox = (props) => {

    return (
        <div className={style.blueBox}>
            <div className={style.whiteBox}>
                {props.children}
            </div>
        </div>
    );
}

export default BlueWhiteBox;