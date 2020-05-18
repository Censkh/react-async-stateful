import * as React                           from "react";
import ApiTest                              from "./ApiTest";
import {BrowserRouter, Link, Route, Switch} from "react-router-dom";
import Home                                 from "./Home";

const App: React.FC = () => {
  return (
    <div>
      <h2>react-asnyc-stateful Examples</h2>
      <BrowserRouter>
        <ul>
          <li>
            <Link to={"/"}>Home</Link>
          </li>
          <li>
            <Link to={"/api"}>Api Test</Link>
          </li>
        </ul>
        <hr/>
        <Switch>
          <Route path={"/api"} component={ApiTest}/>
          <Route path={"*"} component={Home}/>
        </Switch>
      </BrowserRouter>
    </div>
  );
};

export default App;
