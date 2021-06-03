import React, { Component } from "react";
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

import "./article.scss"

const codeComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <SyntaxHighlighter language={match[1]} PreTag="div" children={String(children).replace(/\n$/, '')} {...props} />
    ) : (
      <code className={className} {...props} />
    )
  }
}


const axios = require('axios');

class Article extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: "",
      // TODO 使用配置文件设置url
      urls: "http://127.0.0.1:5000/",
    }
  }
  componentDidMount() {
    this.getArticle(this.props.match.params.id)

  }

  getArticle(article_id) {
    var api = this.state.urls + "api/article/" + article_id;  //拼接api地址

    axios.get(api)
      .then(res => {
        this.setState({ content: res.data.content })
      })
      .catch(err => {
        console.error(err);
      })

  }

  render() {

    return (
      <div className="clearfix typo">
        <Markdown components={codeComponents}
          children={this.state.content} />
      </div>
    )
  }
}

export default Article;
