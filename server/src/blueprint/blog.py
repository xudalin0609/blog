import os

from flask import Blueprint, jsonify
from flask.views import MethodView
from blueprint.auth import auth_required

from models import Article
from globals import date_format
from extensions import db
from blueprint.admin import delete_article, update_article
from utils import get_file_path


blog_bp = Blueprint("blog", __name__)
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))



class Index:
    def __init__(self):
        self.init_articles()

    def init_articles(self):
        self.articles = []
        cur = Article.query.order_by(Article.create_time).all()
        for article in cur:
            self.articles.append(self.article_to_dic(article))

    def article_to_dic(self, article):
        return {
            "title": article.title,
            "tags": article.tags.split(","),
            "year": article.create_time.year,
            "id": article.id,
            "createDate": article.create_time.strftime(date_format),
        }

    def index_by_year(self):
        index = []
        years = {}
        loc = 0
        for article in self.articles:
            year = article.get("year")
            if year not in years:
                years[year] = loc
                index.append({"year": year, "articles": []})
                loc += 1
            index[years[year]]["articles"].append(article)
        return index

    def get_article_by_id(self, id):
        article = Article.query.filter_by(id=id).first()
        article_uid= article.article_uid
        article = self.article_to_dic(article)
        with open(get_file_path(article_uid), "r") as f:
            content = f.read()
        article["content"] = str(content)
        return article

    def get_article_by_tags(self):
        pass

    def get_article_by_title(self, title):
        article = Article.query.filter_by(title=title).first()
        with open(os.path.join(basedir, f"archive/{title}.md"), "r") as f:
            content = f.read()
        article = self.article_to_dic(article)
        article["content"] = str(content)
        return article


@blog_bp.route("/")
def index():
    index = Index().index_by_year()
    return jsonify(index)


class ArticleAPI(MethodView):

    def get(self, id):
        article = Index().get_article_by_id(id)
        return jsonify(article)

    @auth_required 
    def delete(self, id):
        if delete_article(id):
            return jsonify({"message": "success"})
        else:
            return jsonify({"message": "failed"})

    @auth_required    
    def put(self, id):
        update_article(id)
        return jsonify({"message": "success"})



blog_bp.add_url_rule("/<int:id>", view_func=ArticleAPI.as_view('article'))