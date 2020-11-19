import React, { Component } from "react";
// import Markdown from "react-remarkable";
// import Markdown from "react-markdown";
// import Markdown from "remarkable";
import { Remarkable } from "remarkable";
import hljs from "highlight.js";

import "./article.scss";

class Article extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articleWithInfo: null,
    };
    this.md = new Remarkable("full", {
      html: false, // Enable HTML tags in source
      xhtmlOut: false, // Use '/' to close single tags (<br />)
      breaks: false, // Convert '\n' in paragraphs into <br>
      linkify: true, // autoconvert URL-like texts to links
      linkTarget: "", // set target to open link in

      // Enable some language-neutral replacements + quotes beautification
      typographer: false,

      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
      quotes: "“”‘’",

      // Highlighter function. Should return escaped HTML,
      // or '' if input not changed
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value;
          } catch (__) {}
        }

        try {
          return hljs.highlightAuto(str).value;
        } catch (__) {}

        return ""; // use external default escaping
      },
    });
  }

  componentDidMount() {
    this.setState({
      content: this.findContentById(this.props.match.params.id),
    });
  }

  getRawMarkup() {
    return { __html: this.md.render(this.state.articleWithInfo.content) };
  }

  findContentById(id) {
    fetch(`http://139.224.231.207:5000/article/${id}`)
      .then((response) => response.json())
      .then((data) => this.setState({ articleWithInfo: data }));
  }

  render() {
    if (this.state.articleWithInfo === null) {
      return (
        <div className="content">
          <h1>a test line</h1>
        </div>
      );
    } else {
      return (
        <div className="content">
          <h1 className="article-title">{this.state.articleWithInfo.title}</h1>
          <span className="article-date date-font">
            {this.state.articleWithInfo.createDate}
          </span>
          {this.state.articleWithInfo.tags.map((tag) => (
            <a className="article-tag"> {tag} </a>
          ))}
          <div
            className="article-content markdown-body"
            dangerouslySetInnerHTML={this.getRawMarkup()}
          ></div>
        </div>
      );
    }
  }
}

export default Article;
