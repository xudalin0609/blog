from flask import Blueprint, views
from flask import jsonify

from utils import get_index
from errors import api_abort


bp_index = Blueprint("index", __name__)


class IndexAPI(views.MethodView):

    def _sort_index_by_year(self, index):
        sorted_index = {}
        for _id, info in index.items():
            year = info["create_time"][:4]
            if year in sorted_index:
                sorted_index[year].append(info)
            else:
                sorted_index[year] = [info]
        sorted(sorted_index)
        return sorted_index

    def _get_index_by_type(self):
        pass

    # TODO 修改error方式，优化排序算法
    def get(self, sort_by):
        index = get_index()
        if sort_by == "type":
            sorted_index = self._get_index_by_type(index)
        elif sort_by == "year":
            sorted_index = self._sort_index_by_year(index)
        else:
            return api_abort(401, "sort_type invalid")

        return jsonify(sorted_index)


bp_index.add_url_rule(
    "/index", view_func=IndexAPI.as_view('index'), defaults={"sort_by": "year"})
