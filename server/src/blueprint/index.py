from flask import Blueprint, views
from flask import jsonify

import utils
from utils import get_index
from errors import api_abort


bp_index = Blueprint("index", __name__)


class IndexAPI(views.MethodView):

    def _sort_index_by_year(self, index):
        sorted_index = []
        year_cache = {}
        for _, info in index.items():
            year = info["create_date"][:4]
            if year in year_cache:
                sorted_index[year_cache[year]]['articles'].append(info)
            else:
                sorted_index.append({'year': year, 'articles': [info]})
                year_cache[year] = len(year_cache)
        sorted_index = sorted(
            sorted_index, key=lambda x: x['year'], reverse=True)
        return sorted_index

    def _get_index_by_type(self):
        pass

    @utils.response()
    def get(self, sort_by):
        index = get_index()
        if sort_by == "type":
            sorted_index = self._get_index_by_type(index)
        elif sort_by == "year":
            sorted_index = self._sort_index_by_year(index)
        else:
            return api_abort(401, "sort_type invalid")

        return sorted_index


bp_index.add_url_rule(
    "/index", view_func=IndexAPI.as_view('index'), defaults={"sort_by": "year"})
