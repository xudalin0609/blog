import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";

import Header from "./components/Header/header";
import Footer from "./components/Footer/footer";
import Index from "./components/Index/index"

import './App.css';

function App() {
  return (
    <Router>
      <div class="container-fluid">
        <Header />
        <Route exact path="/" component={Index} />
        <Footer />
      </div>
    </Router>

  );
}

export default App;
