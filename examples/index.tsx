import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./views/App";

window.onload = () => {
  ReactDOM.createRoot(document.body.querySelector("#root")).render(<App />);
};
