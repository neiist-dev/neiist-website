import Spinner from 'react-bootstrap/Spinner';

const firstColor  = { color: "#2863fd" }
const secondColor = { color: "#248be3" }
const thirdColor  = { color: "#35d1fa" }
const fourthColor = { color: "#5ee8fa" }

const LoadSpinner = () => (
  <div style={{ textAlign:'center', paddingTop:'25px' }}>
    <Spinner animation="grow" style={firstColor}  />
    <Spinner animation="grow" style={secondColor} />
    <Spinner animation="grow" style={thirdColor}  />
    <Spinner animation="grow" style={fourthColor} />
    <span className="visually-hidden">Loading...</span>
  </div>
);

export default LoadSpinner;