import React, { Component } from "react";
import axios, { post } from "axios";
import store from "../../Store";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";

import "./background.scss";

class BackGround extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      isLoggedIn: store.getState().loginStatus.isLoggedIn,
      token: store.getState().loginStatus.token,
      uploadStatus: "",
      archives: [],
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUpload = this.fileUpload.bind(this);
    // this.fileDelete = this.fileDelete.bind(this);
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
    console.log(this.state.token);
    console.log(this.state.isLoggedIn);
    const config = {
      headers: {
        "content-type": "multipart/form-data",
        Authorization: "Bearer " + this.state.token,
      },
    };
    const formData = new FormData();
    formData.append("file", file);

    post(url, formData, config)
      .then((response) => {
        this.setState({ uploadStatus: response.data.status });
      })
      .catch((error) => {
        console.log(error.response.data);
        this.setState({ uploadStatus: error.response.data.message });
      });
  }

  fileDelete(id) {
    const url = process.env.API_URL + `/api/article/${id}`;
    axios
      .delete(url, {
        headers: {
          Authorization: "Bearer " + this.state.token,
        },
      })
      .then((response) => {
        this.setState({ uploadStatus: response.data.status });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  fileUpdate(id, file) {
    const url = process.env.API_URL + `/api/article/${id}`;
    const formData = new FormData();
    formData.append("file", file);
    axios
      .put(url, formData, {
        headers: {
          Authorization: "Bearer " + this.state.token,
        },
      })
      .then((response) => {
        this.setState({ uploadStatus: response.data.status });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getArchives() {
    fetch(process.env.API_URL + "/api/article/")
      .then((response) => response.json())
      .then((data) => this.setState({ archives: data }));
  }

  componentDidMount() {
    this.getArchives();
    console.log(this.state.archives);
  }

  render() {
    if (this.state.isLoggedIn) {
      return (
        <div className="content">
          {this.state.archives.map((archive) => (
            <div key={archive.year.toString()}>
              <h2 className="archive-title">{archive.year}</h2>
              {archive.articles.map((article) => (
                <article className="archive-item" key={article.id.toString()}>
                  {
                    <Link
                      to={`/article/${article.id}`}
                      className="archive-item-link"
                    >
                      {article.title}
                    </Link>
                  }
                  <span className="archive-item-date date-font">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={this.fileUpdate.bind(this, article.id)}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger m-l-8"
                      onClick={this.fileDelete.bind(this, article.id)}
                    >
                      Delete
                    </button>
                  </span>
                </article>
              ))}
            </div>
          ))}
          <form onSubmit={this.onFormSubmit}>
            <h1>File Upload</h1>
            <input type="file" onChange={this.onChange} />
            <button type="submit">Upload</button>
          </form>
          <div>{this.state.uploadStatus}</div>
        </div>
      );
    }
    return <Redirect to="/admin/login" />;
  }
}

export default BackGround;
