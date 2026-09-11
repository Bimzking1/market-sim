import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyInitialTheme } from "./components/ThemeToggle";
import "./index.css";
import App from "./App";

applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
