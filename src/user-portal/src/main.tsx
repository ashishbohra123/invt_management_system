import React from "react"; import ReactDOM from "react-dom/client"; import { App } from "./App";

const style = document.createElement("style");
style.textContent = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:0;background:#F8FAFC;color:#111;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}*,*::before,*::after{box-sizing:border-box}`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
