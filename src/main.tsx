import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "react-joyride/lib/react-joyride-compiled.css";

createRoot(document.getElementById("root")!).render(<App />);
