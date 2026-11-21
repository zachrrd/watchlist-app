import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { neon } from "./lib/neon";
import { NeonAuthUIProvider } from "@neondatabase/neon-js/auth/react";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NeonAuthUIProvider authClient={neon.auth} emailOTP>
      <App />
    </NeonAuthUIProvider>
  </StrictMode>,
);
