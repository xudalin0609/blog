import React, { Component } from "react";
import { Link } from "react-router-dom";

import "./header.scss";
import logo from "./frankestein.svg";

class Header extends Component {
  render() {
    return (
      <div className="header">
        <nav className="nav">
          <a href="/" className="nav-logo">
            <img src={logo}></img>
          </a>
          <ul className="nav-links">
            <li>
              <a href="#">Home</a>
            </li>
            <li>
              <a href="#">Python</a>
            </li>
            <li>
              <a href="#">Github</a>
            </li>
            <Link to={`/admin/uploader`}>Others</Link>
          </ul>
        </nav>
      </div>
    );
  }
}

export default Header;
