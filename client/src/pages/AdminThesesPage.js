import React, { useState } from "react";
import UploadFile from "../components/UploadFile";

const AdminThesesPage = () => (
  <div style={{ margin: "10px 30vw" }}>
    <UploadFile
      title="Teses"
      instructions="Get a file with thesis on ESTUDANTE &gt; Candidatura a Dissertação &gt; Available Proposals<br />
                    * Delete everything above the theses' beggining on &lt;tbody&gt;. Delete everything after &lt;/tbody&gt;"
      postUrl={`${process.env.REACT_APP_ROOT_API}/theses`}
    />
  </div>
);

export default AdminThesesPage;
