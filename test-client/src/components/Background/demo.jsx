import React, { Component } from "react";
import store from "../../Store";
import * as Action from "../../Action";

export default class Demo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      count: store.getState().demo,
      isLoggedIn: store.getState().isLoggedIn,
    };
  }
  onIncrement = () => {
    store.dispatch(Action.increment());
  };

  onDecrement = () => {
    store.dispatch(Action.decrement());
  };

  render() {
    store.subscribe(() =>
      console.log("Store is changed: " + store.getState().demo)
    );
    store.subscribe(() =>
      this.setState({
        count: store.getState().demo,
        isLoggedIn: store.getState().isLoggedIn,
      })
    );

    if (this.state.isLoggedIn) {
      return (
        <div className="container">
          <h1 className="text-center mt-5">{this.state.count}</h1>
          <p className="text-center">
            <button className="btn btn-primary mr-2" onClick={this.onIncrement}>
              Increase
            </button>
            <button className="btn btn-danger my-2" onClick={this.onDecrement}>
              Decrease
            </button>
          </p>
        </div>
      );
    }
    return <h1>wow</h1>
  }
}
