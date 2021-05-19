from flask import Blueprint, jsonify, abort
from flask.views import MethodView

from utils import get_article
from errors import api_abort

bp_article = Blueprint("article", __name__)


class ArticleAPI(MethodView):

    def get(self, id):
        try:
            return jsonify(get_article(id))
        except KeyError:
            return api_abort(404, message="Not Found")


bp_article.add_url_rule("/article/<string:id>",
                        view_func=ArticleAPI.as_view('article'))
