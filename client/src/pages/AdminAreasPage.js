import React, { useState } from "react";
import UploadFile from "../components/UploadFile";

const AdminAreasPage = () => (
  <div style={{ margin: "10px 30vw" }}>
    <UploadFile
      title="Areas"
      instructions="areas em formato json"
      postUrl="http://localhost:5000/areas"
    />
  </div>
);

export default AdminAreasPage;
