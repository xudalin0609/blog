import React, { Component } from "react";
import { Link } from "react-router-dom";

import "./header.scss";
import logo from "./frankestein.svg";

class Header extends Component {
  render() {
    return (
      <div className="header">
        <nav className="nav">
          {/* <a href="/" className="nav-logo">
            <img src={logo}></img>
          </a> */}
          <Link to={`/login`} className="nav-logo">
            <img src={logo}></img>
          </Link>
          <ul className="nav-links">
            <Link to={`/`}>Home</Link>
            <Link to="#">Python</Link>
            <a href="https://github.com/xudalin0609" target="_blank">
              Github
            </a>
            <Link to={`/admin/uploader`}>Admin</Link>
          </ul>
        </nav>
      </div>
    );
  }
}

export default Header;
