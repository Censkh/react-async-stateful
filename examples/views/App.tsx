import type * as React from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import ApiTest from "./ApiTest";
import Debounced from "./Debounced";
import Home from "./Home";
import MinimumPending from "./MinimumPending";

const App = () => {
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
          <li>
            <Link to={"/minimum-pending"}>Minimum Pending</Link>
          </li>
          <li>
            <Link to={"/debounced"}>Debounced</Link>
          </li>
        </ul>
        <hr />
        <Routes>
          <Route path={"/api"} element={<ApiTest />} />
          <Route path={"/debounced"} element={<Debounced />} />
          <Route path={"/minimum-pending"} element={<MinimumPending />} />
          <Route path={"*"} element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
