import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Header from "./components/Header/header";
import Archive from "./components/Archive/archive";
import Footer from "./components/Footer/footer";

import "./App.scss";

function App() {
  return (
    <Router>
      <div>
        <Header />
        <Route exact path="/" component={Archive} />
        {/* <Route path="/blog" component={Blog} />
          <Route path="/demo" component={Demo} />
          <Route path="/about" component={About} /> */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
