const ObjectiveItem = ({color, text}) => {
    return (
        <p style={{color: "white", backgroundColor: color, borderRadius: "0.5em", padding: "0.5em"}}>
            {text}
        </p>
    );
}

export default ObjectiveItem;