import React, { Component } from "react";
// import ReactMarkdown from "react-markdown";
import Markdown from "react-remarkable";
import "./article.scss";

class Article extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articleWithInfo: null,
    };
  }

  componentDidMount() {
    console.log(this.props);
    this.setState({
      content: this.findContentById(this.props.match.params.id),
    });
  }

  findContentById(id) {
    fetch(`http://127.0.0.1:5000/article/${id}`)
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
          <span className="article-data">
            {this.state.articleWithInfo.createTime}
          </span>
          {this.state.articleWithInfo.tags.map((tag) => (
            <a className="article-tag"> {tag} </a>
          ))}
          <div  className="article-content">
            <Markdown source={this.state.articleWithInfo.content}/>
          </div>
          {/* <article>{this.state.content}</article> */}
        </div>
      );
    }
  }
}

export default Article;
