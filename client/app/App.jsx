import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Header from "./components/Header/header";
import Archive from "./components/Archive/archive";
import Footer from "./components/Footer/footer";

import Article from "./components/Article/article";
import Uploader from "./components/Background/uploader";
import EnsureLoggedInContainer from "./components/Background/auth";
import Demo from "./components/Background/demo";

import "./App.scss";

function App() {
  return (
    <Router>
      <div>
        <Header />
        <Route exact path="/" component={Archive} />
        <Route path="/article/:id" component={Article} />
        {/* <Route component={EnsureLoggedInContainer}> */}
        <Route path="/admin/uploader" component={Demo} />
        {/* </Route> */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
