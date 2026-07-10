import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />

    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 2500,
        style: {
          fontSize: "15px",
          fontWeight: "600",
          padding: "14px 18px",
          borderRadius: "12px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
        },
        success: {
          duration: 2500,
        },
        error: {
          duration: 3500,
        },
      }}
    />
  </React.StrictMode>
);