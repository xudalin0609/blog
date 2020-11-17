import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Header from "./components/Header/header";
import Archive from "./components/Archive/archive";
import Footer from "./components/Footer/footer";

import "./App.scss";
import Article from "./components/Article/article";

function App() {
  return (
    <Router>
      <div>
        <Header />
        <Route exact path="/" component={Archive} />
        <Route path="/article/:id" component={Article} />
        {/* <Route path="/blog" component={Blog} />
          <Route path="/demo" component={Demo} />
          <Route path="/about" component={About} /> */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
