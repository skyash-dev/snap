import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AptabaseProvider } from "@aptabase/react";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AptabaseProvider appKey="A-US-4448168781">
      <App />
    </AptabaseProvider>
  </React.StrictMode>
);
