import style from "../../pages/css/HomePage.module.css";

const BlueWhiteBox = (props) => {
  return (
    <div
      className={
        props.id === "SINFO" ? `${style.blueBox} ${style.sinfoBlueBox}` : style.blueBox
      }
    >
      <div
        className={
          props.className !== undefined
            ? `${style.whiteBox} ${props.className}`
            : style.whiteBox
        }
      >
        {props.children}
      </div>
    </div>
  );
};

export default BlueWhiteBox;
