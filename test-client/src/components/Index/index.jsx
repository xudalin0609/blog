import React, { Component } from "react";
import { Link } from 'react-router-dom';

import "./index.scss";
import { getBaseUrl } from "../../utils";

const axios = require('axios');

class Index extends Component {
    constructor(props) {
        super(props);
        let baseUrl = getBaseUrl();

        this.state = {
            index: [],
            urls: baseUrl,
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
                <div className="title-line">
                    <Link to={`/article/${article.id}`}>{article.name}</Link>
                    <span>{article.create_date}</span>
                </div >
            ))
        )
    }

    render() {
        return (
            <div>
                {
                    this.state.index.map((year_articles) => (
                        <div className="year-block">
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
