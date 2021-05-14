import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Header from "./components/Header/header";
import Archive from "./components/Archive/archive";
import Footer from "./components/Footer/footer";

import Article from "./components/Article/article";
import Auth from "./components/Background/auth";
// import Uploader from "./components/Background/uploader";
import Background from "./components/Background/background";

import "./App.scss";

function App() {
  return (
    <Router>
      <div>
        <Header />
        <div className="content">
          <Route exact path="/" component={Archive} />
          <Route path="/article/:id" component={Article} />
          <Route path="/admin/login" component={Auth} />
          <Route path="/admin" component={Background} />
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
