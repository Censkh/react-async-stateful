import * as React from "react";
import ApiTest from "./ApiTest";
import {Link, BrowserRouter, Route, Switch} from "react-router-dom";
import {DebugOverlay} from "./DebugOverlay";

const App: React.FC = () => {
    return <div>
        <h2>react-asnyc-stateful Examples</h2>
        <BrowserRouter>
            <ul>
                <li><Link to={"/"}>Home</Link></li>
                <li><Link to={"/api"}>Api Test</Link></li>
                <li><Link to={"/debug-overlay"}>Debug Overlay</Link></li>
            </ul>
            <hr/>
            <Switch>
                <Route path={"/api"} component={ApiTest}/>
                <Route path={"/debug-overlay"} component={DebugOverlay}/>
            </Switch>
        </BrowserRouter>
    </div>;
};

export default App;