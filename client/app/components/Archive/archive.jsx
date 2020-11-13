import React, { Component } from "react";

import "./archive.scss";

class Archive extends Component {
  constructor(props) {
    super(props);
    this.state = {
      archives: [],
    };
  }

  componentDidMount() {
    // Simple GET request using fetch
    fetch("http://127.0.0.1:5000")
      .then((response) => response.json())
      .then((data) => this.setState({ archives: data }));
  }

  render() {
    return (
      <div className="content">
        {this.state.archives.map((archive) => (
          <div>
            <h2 className="archive-title">{archive.year}</h2>
            {archive.articles.map((article) => (
              <article>
                <a href="#" className="archive-item-link">
                  {article.title}
                </a>
              </article>
            ))}
          </div>
        ))}
      </div>
    );
  }
}

export default Archive;
