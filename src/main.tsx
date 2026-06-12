import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Providers from "@/app/providers";
import { AppRoutes } from "./routes";
import "./app/globals.css"; // Tailwind and globals

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  </React.StrictMode>
);
