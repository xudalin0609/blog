import React, { Component } from "react";
import store from "../../Store";
import * as Action from "../../Action";


// import {connect} from 'react-redux'

class EnsureLoggedInContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: store.getState().isLoggedIn,
    };
  }

  render() {
    console.log("login status" + this.state.isLoggedIn);
    if (!this.state.isLoggedIn) {
      return <h1>wow</h1>;
    }

    return <h1>??????</h1>;
  }
}

export default EnsureLoggedInContainer;
