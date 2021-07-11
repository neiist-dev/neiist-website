import React, { useState } from "react";
import UploadFile from "../components/UploadFile";

const AdminAreasPage = () => (
  <div style={{ margin: "10px 30vw" }}>
    <UploadFile
      title="Areas"
      instructions="areas em formato json"
      postUrl={`${process.env.REACT_APP_ROOT_API}/areas`}
    />
  </div>
);

export default AdminAreasPage;
