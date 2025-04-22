import React from "react";
import styles from '../../pages/css/ContactsPage.module.css';

const ContactCard = ({ title, content, className }) => (
  <div className={`${styles.card} ${className || ''}`}>
    <h4 className={styles.cardTitle}>{title}</h4>
    <div className={styles.cardContent}>{content}</div>
  </div>
);

export default ContactCard;
