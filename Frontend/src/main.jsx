import App from "./App.jsx";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Toaster } from "sonner";


const container = document.getElementById("root");
const root = createRoot(container);
root.render(
    <>
        <App />
        <Toaster richColors position="top-right" />
    </>
);