import React from "react";
import styles from '../../pages/css/ContactsPage.module.css';

const ContactCard = ({ title, content, className }) => (
  <div className={`${styles.contactCard} ${className || ''}`}>
    <h4>{title}</h4>
    <p>{content}</p>
  </div>
);

export default ContactCard;
