import os

from flask import Blueprint, jsonify

from models import Article


blog_bp = Blueprint('blog', __name__)
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
            "tags": article.tags.split(','),
            "year": article.create_time.year,
            "id": article.id
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
        article = self.article_to_dic(article)
        title = article.get("title")
        with open(os.path.join(basedir, f"archive/{title}.md"), "r") as f:
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
            

@blog_bp.route('/')
def index():
    index = Index().index_by_year()
    return jsonify(index)


@blog_bp.route('/<int:id>')
def article(id):
    article = Index().get_article_by_id(id)
    return jsonify(article)