import React, { Component } from "react";

import "./header.scss";

class Header extends Component {
  render() {
    return (
      <div className="header">
        <nav className="nav">
          <a href="/" className="nav-logo">
            <img src={require("../../")}></img>
          </a>
          <ul className="nav-links">
            <li>
              <a href="#">
                Home
              </a>
            </li>
            <li>
              <a href="#">
                Python
              </a>
            </li>
            <li>
              <a href="#">
                Github
              </a>
            </li>
            <li>
              <a href="#">
                Others
              </a>
            </li>
          </ul>
        </nav>
      </div>
    );
  }
}

export default Header;
