import React, { Component } from "react";
import { Link } from "react-router-dom";

import "../../static/css/header.scss";
import logo from "../../static/images/frankestein.svg";

class Header extends Component {
  render() {
    return (
      <div className="header">
        <nav className="navbar">
          <img src={logo} className="logo" alt=""></img>
          <li className="">
            <Link to={`/`} className="">Home</Link>
          </li>
          <li className="">
            <Link to="#" className="">Python</Link>
          </li>
          <li className="">
            <a href="https://github.com/xudalin0609" target="_blank">
              Github
          </a>
          </li>
        </nav >
      </div>
    );
  }
}

export default Header;
