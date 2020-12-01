import React, { Component } from "react";
import { post } from "axios";
import store from "../../Store";
import { Redirect } from "react-router";

class Uploader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      isLoggedIn: store.getState().loginStatus.isLoggedIn,
      token: store.getState().loginStatus.token,
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUpload = this.fileUpload.bind(this);
  }

  onFormSubmit(e) {
    e.preventDefault(); // Stop form submit
    this.fileUpload(this.state.file);
  }
  onChange(e) {
    this.setState({ file: e.target.files[0] });
  }
  fileUpload(file) {
    const url = process.env.API_URL + "/api/admin/upload";
    // const url = "http://139.224.231.207/api/admin/upload";
    const config = {
      headers: {
        "content-type": "multipart/form-data",
      },
    };
    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", this.state.token);
    formData.append("token_typle", "Bearer");
    post(url, formData, config)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
        // this.setState({ message: response.message });
      });
  }

  render() {
    if (this.state.isLoggedIn) {
      return (
        <div className="content">
          <form onSubmit={this.onFormSubmit}>
            <h1>File Upload</h1>
            <input type="file" onChange={this.onChange} />
            <button type="submit">Upload</button>
          </form>
        </div>
      );
    }
    return <Redirect to="/login" />;
  }
}

export default Uploader;
