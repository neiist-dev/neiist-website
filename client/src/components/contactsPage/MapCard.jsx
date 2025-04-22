import React from "react";
import styles from '../../pages/css/ContactsPage.module.css';

const MapCard = ({ title, addressLines, mapSrc }) => (
  <div className={styles.cardMap}>
    <h2>{title}</h2>
    <p className={styles.content}>
      {addressLines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}<br />
        </React.Fragment>
      ))}
    </p>
    <iframe
      title={title}
      src={mapSrc}
      allowFullScreen
      loading="lazy"
    />
  </div>
);

export default MapCard;

