import React, { Component } from "react";
import "../../static/css/index.scss";

const axios = require('axios');

class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            index: [],
            // TODO 使用配置文件设置url
            urls: "http://127.0.0.1:5000/",
        }
    }

    componentDidMount() {
        this.getApiData()

    }

    getApiData() {
        var api = this.state.urls + "api/index";  //拼接api地址

        axios.get(api)
            .then(res => {
                this.setState({ index: res.data.data })
            })
            .catch(err => {
                console.error(err);
            })
    }

    getTitleLine(articles) {
        return (
            articles.map((article) => (
                <article>
                    <a>{article.name}</a>
                    <span>{article.create_date}</span>
                </article>
            ))
        )
    }

    render() {
        return (
            <div>
                {
                    this.state.index.map((year_articles) => (
                        <div>
                            <h1>{year_articles.year}</h1>
                            {this.getTitleLine(year_articles.articles)}
                        </div>
                    ))
                }

            </div>
        )

    }
}

export default Index;
