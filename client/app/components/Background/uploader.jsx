import React, { Component } from "react";
import axios, { post } from "axios";

class Uploader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
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
    const url = "http://127.0.0.1:5000/api/admin/upload";
    // const url = "http://139.224.231.207/api/admin/upload";
    const formData = new FormData();
    formData.append("file", file);
    const config = {
      headers: {
        "content-type": "multipart/form-data",
      },
    };
    formData.append("file", file);
    return post(url, formData, config);
  }

  render() {
    return (
      <div className='content'>
        <form onSubmit={this.onFormSubmit}>
          <h1>File Upload</h1>
          <input type="file" onChange={this.onChange} />
          <button type="submit">Upload</button>
        </form>
      </div>
    );
  }
}

export default Uploader;
