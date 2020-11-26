import React, { Component } from "react";
import store from "../../Store";
import * as Action from "../../Action";
import { post } from "axios";
import { Redirect } from "react-router";
import "./auth.scss";

// import {connect} from 'react-redux'

class Auth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: store.getState().loginStatus.isLoggedIn,
      username: "",
      password: "",
      message: "",
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  login() {
    const url = "http://127.0.0.1:5000/api/oauth/token";
    // const url = "http://139.224.231.207/api/admin/upload";
    const formData = new FormData();
    formData.append("username", this.state.username);
    formData.append("password", this.state.password);
    formData.append("grant_type", "password");
    const config = {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    };
    post(url, formData, config)
      .then((response) => {
        console.log(response);
        const token = response.data.token;
        this.setState({ message: "登陆成功" });
        this.setState({ isLoggedIn: true });
        store.dispatch(Action.login(token));
      })
      .catch((err) => {
        console.log(err.response);
        this.setState({ message: err.response.data.message });
      });
  }

  handleSubmit(event) {
    this.login();
    event.preventDefault();
  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value,
    });
  }

  render() {
    if (this.state.isLoggedIn) {
      return <Redirect to="/" />;
    }
    return (
      <div className="login-container">
        <form onSubmit={this.handleSubmit}>
          <span className="login-form-title">LOGIN</span>
          <div className="login-form-container">
            <input
              type="text"
              name="username"
              onChange={this.handleChange}
              placeholder="Username"
              className="login-form-input"
            />
          </div>

          <div className="login-form-container">
            <input
              type="password"
              name="password"
              onChange={this.handleChange}
              placeholder="Password"
              className="login-form-input"
            />
          </div>
          <div className="login-form-container">
            <button type="submit" className="login-form-btn">
              登录
            </button>
          </div>
        </form>
        <h1>{this.state.message}</h1>
      </div>
    );
  }
}

export default Auth;
