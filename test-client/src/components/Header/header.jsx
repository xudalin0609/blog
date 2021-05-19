import React, { Component } from "react";
import { Link } from "react-router-dom";

import "../../static/css/header.scss";
import logo from "../../static/images/frankestein.svg";

class Header extends Component {
  render() {
    return (
      <nav className="navbar nav-pills nav-fill" style={{ backgroundColor: "#e3f2fd" }}>
        <a class="nav-item nav-link" href="#">
          <img src={logo} width="30" height="30" alt=""></img>
        </a>
        <li className="nav-item nav-link">
          <Link to={`/`} className="nav-link">Home</Link>
        </li>
        <li className="nav-item nav-link">
          <Link to="#" className="nav-link">Python</Link>
        </li>
        <li className="nav-item nav-link">
          <a href="https://github.com/xudalin0609" target="_blank" className="nav-link">
            Github
          </a>
        </li>
      </nav >
    );
  }
}

export default Header;
