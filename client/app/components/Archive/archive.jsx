import React, { Component } from "react";
import { Router, Route, hashHistory, IndexRoute } from 'react-router'
import { Link } from "react-router-dom";

import Article from '../Article/article';


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
    fetch("http://127.0.0.1:5000/article")
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
                { <Link to={`/article/${article.id}`} className="archive-item-link"> {article.title}</Link> }
              </article>
            ))}
          </div>
        ))}
      </div>
    );
  }
}

export default Archive;
