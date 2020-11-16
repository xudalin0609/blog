import os
import json

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    with open("./archive/.index", "r") as f:
        index_fields = json.load(f)
    return jsonify(index_fields)


@app.route("/article/<title>")
def article(title):
    with open(f"./archive/{title}.md", "r") as f:
        s = f.read()
        f.close()

    with open("./archive/.ext_infos", "r") as f:
        ext_infos = json.load(f)

    article_with_info = ext_infos.get(title)
    article_with_info["content"] = str(s)

    return jsonify(article_with_info)


@app.route("/tags/<tag>")
def article(title):
    # with open(os.path.join("/mnt/e/myblog/server/src/archive", f"{title}.md")) as f:
    #     s = f.read()
    #     f.close()

    # with open("./archive/.ext_infos", "r") as f:
    #     ext_infos = json.load(f)

    # article_with_info = ext_infos.get(title)
    # article_with_info["content"] = str(s)

    return jsonify({"TODO": "to add search tags api"})