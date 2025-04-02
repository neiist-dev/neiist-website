import { _, Col } from "react-bootstrap";

const PartnerItem = ({ alt, src, href, scale = "1.0" }) => (
  <Col style={{ display: "flex", justifyContent: "center" }}>
      <a href={href} target="_blank" rel="noopener noreferrer">
          <img src={src} style={{ width: "50%", scale, fontWeight: "bold" }} alt={alt} />
      </a>
  </Col>
);

export default PartnerItem;