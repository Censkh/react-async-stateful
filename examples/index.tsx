import * as React    from "react";
import * as ReactDOM from "react-dom";
import App           from "./views/App";

window.onload = () => {
  ReactDOM.render(<App/>, document.body.querySelector("#root"));
};
