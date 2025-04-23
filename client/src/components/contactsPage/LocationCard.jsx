import React from "react";
import styles from '../../pages/css/ContactsPage.module.css';

const LocationCard = ({ roomNumber, addressLines, mapSrc }) => (
  <div className={styles.locationCard}>
    <h2>{roomNumber}</h2>
    <p>
      {addressLines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}<br />
        </React.Fragment>
      ))}
    </p>
    <iframe
      className={styles.mapFrame}
      title={roomNumber}
      src={mapSrc}
      allowFullScreen
      loading="lazy"
    />
  </div>
);

export default LocationCard;
