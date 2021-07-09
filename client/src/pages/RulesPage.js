import React, { useState } from "react";
import { Document, Page } from 'react-pdf';
import estatutos from "../images/estatutos/EstatutosFinal.pdf";

const RulesPage = () => {

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div style={{ margin: "10px 20vw" }}>
      <h2 style={{ textAlign: "center" }}>ESTATUTOS</h2>
      <Document
        file={estatutos}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      <p>Page {pageNumber} of {numPages}</p>
    </div>
  )
};

export default RulesPage;
