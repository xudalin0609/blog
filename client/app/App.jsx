import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Header from "./components/Header/header";
import Archive from "./components/Archive/archive";
import Footer from "./components/Footer/footer";

import Article from "./components/Article/article";
import Uploader from "./components/Background/uploader";

import "./App.scss";

function App() {
  return (
    <Router>
      <div>
        <Header />
        <Route exact path="/" component={Archive} />
        <Route path="/article/:id" component={Article} />
        <Route path="/admin/uploader" component={Uploader} />
        {/* <Route path="/blog" component={Blog} />
          <Route path="/demo" component={Demo} />
          <Route path="/about" component={About} /> */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
