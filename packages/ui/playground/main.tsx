import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "../src/tokens/tokens.css";
import { Toaster } from "../src";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Toaster position="top-right" offset={{ top: "96px", right: "16px", left: "16px" }} />
    <App />
  </React.StrictMode>
);
