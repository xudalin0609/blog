import React, { Component } from "react";

import "./footer.scss";

class Footer extends Component {
  render() {
    return (
      <div className="footer-copyright text-center py-3">
        Think&Code © 2020 |<a href="http://beian.miit.gov.cn/"> 浙ICP备2020044669号-1</a>
      </div>
    );
  }
}

export default Footer;
